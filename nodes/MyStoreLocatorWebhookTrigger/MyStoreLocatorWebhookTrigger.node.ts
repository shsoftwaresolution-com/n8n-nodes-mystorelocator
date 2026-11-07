import { createHmac, timingSafeEqual } from 'crypto';
import {
	NodeApiError,
	NodeConnectionTypes,
	type IDataObject,
	type IHookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
	type JsonObject,
} from 'n8n-workflow';
import { mslApiRequest } from '../shared/transport';

/**
 * REST hook: on activation the node registers its URL with POST /api/v1/ext/webhooks (scope webhooks:write) and keeps id + secret
 * in the workflow's static data; on deactivation DELETE /webhooks/:id. Every request is checked against
 * X-MSL-Signature: t=<unix>,sha256=<hex HMAC-SHA256(secret, "<t>.<raw body>")>.
 */
export function verifySignature(secret: string, header: string, rawBody: string, now = Date.now(), toleranceSec = 300): boolean {
	const parts = Object.fromEntries(
		String(header || '')
			.split(',')
			.map((p) => p.trim().split('='))
			.filter((p) => p.length === 2),
	) as Record<string, string>;
	const t = Number(parts.t);
	if (!parts.sha256 || !Number.isFinite(t) || Math.abs(now / 1000 - t) > toleranceSec) return false;
	const expected = createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex');
	const a = Buffer.from(expected, 'hex');
	const b = Buffer.from(parts.sha256, 'hex');
	return a.length === b.length && timingSafeEqual(a, b);
}

export class MyStoreLocatorWebhookTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'My Store Locator Webhook Trigger',
		name: 'myStoreLocatorWebhookTrigger',
		icon: { light: 'file:../../icons/mystorelocator.svg', dark: 'file:../../icons/mystorelocator.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow on My Store Locator events in real time (registers a webhook automatically)',
		defaults: { name: 'My Store Locator Webhook' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'myStoreLocatorApi', required: true }],
		webhooks: [{ name: 'default', httpMethod: 'POST', responseMode: 'onReceived', path: 'mystorelocator' }],
		properties: [
			{
				displayName:
					'The API key needs the scope webhooks:write plus the read scope of the events (locations:read, maps:read, leads:read). Webhooks are included from the Starter plan (Starter 10, Pro 25).',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				options: [
					{ name: 'Import Finished', value: 'import.finished' },
					{ name: 'Lead Created', value: 'lead.created' },
					{ name: 'Location Created', value: 'location.created' },
					{ name: 'Location Deleted (Archived)', value: 'location.deleted' },
					{ name: 'Location Updated', value: 'location.updated' },
					{ name: 'Map Published', value: 'map.published' },
				],
				default: ['location.created', 'location.updated'],
				description: 'The events that start the workflow',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const state = this.getWorkflowStaticData('node');
				if (!state.webhookId) return false;
				const url = this.getNodeWebhookUrl('default');
				const res = await mslApiRequest.call(this, 'GET', '/webhooks');
				const found = ((res.data as IDataObject[]) || []).find((w) => String(w.id) === String(state.webhookId) && w.url === url && w.active !== false);
				if (found) return true;
				delete state.webhookId;
				delete state.secret;
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const state = this.getWorkflowStaticData('node');
				const events = this.getNodeParameter('events', []) as string[];
				const body: IDataObject = {
					url: this.getNodeWebhookUrl('default'),
					events,
					format: 'json',
					name: `n8n – ${this.getWorkflow().name || 'workflow'}`.slice(0, 120),
					lang: 'en',
				};
				const res = await mslApiRequest.call(this, 'POST', '/webhooks', {}, body);
				if (!res.id) return false;
				state.webhookId = res.id;
				state.secret = res.secret;
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const state = this.getWorkflowStaticData('node');
				if (state.webhookId) {
					try {
						await mslApiRequest.call(this, 'DELETE', `/webhooks/${encodeURIComponent(String(state.webhookId))}`);
					} catch (error) {
						const status = Number((error as JsonObject).httpCode ?? (error as JsonObject).statusCode ?? 0);
						if (status !== 404) throw new NodeApiError(this.getNode(), error as JsonObject);   // 404 = already gone
					}
				}
				delete state.webhookId;
				delete state.secret;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const state = this.getWorkflowStaticData('node');
		const secret = String(state.secret || '');
		const events = this.getNodeParameter('events', []) as string[];
		const body = this.getBodyData() as IDataObject;

		if (secret) {
			const raw = (req as unknown as { rawBody?: Buffer }).rawBody;
			const rawBody = raw ? raw.toString('utf8') : JSON.stringify(body);
			if (!verifySignature(secret, String(req.headers['x-msl-signature'] || ''), rawBody)) {
				const res = this.getResponseObject();
				res.status(401).json({ error: 'invalid_signature' });
				return { noWebhookResponse: true };
			}
		}
		const event = String(body.event || req.headers['x-msl-event'] || '');
		if (events.length && !events.includes(event)) return { webhookResponse: { ok: true, ignored: event } };

		return { workflowData: [this.helpers.returnJsonArray([body])] };
	}
}
