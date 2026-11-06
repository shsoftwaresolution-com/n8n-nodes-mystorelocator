// Unit tests against the built nodes (dist/) with a fake n8n context – no n8n instance, no network.
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const { MyStoreLocator } = require('../dist/nodes/MyStoreLocator/MyStoreLocator.node.js');
const { MyStoreLocatorTrigger } = require('../dist/nodes/MyStoreLocatorTrigger/MyStoreLocatorTrigger.node.js');
const { MyStoreLocatorWebhookTrigger, verifySignature } = require('../dist/nodes/MyStoreLocatorWebhookTrigger/MyStoreLocatorWebhookTrigger.node.js');
const { MyStoreLocatorApi } = require('../dist/credentials/MyStoreLocatorApi.credentials.js');

const BASE = 'https://app.my-store-locator.com/api/v1/ext';

function ctx({ params = {}, items = [{ json: {} }], responder, mode = 'trigger', staticData = {} }) {
	const calls = [];
	return {
		calls,
		staticData,
		getInputData: () => items,
		getNodeParameter: (name, _i, fallback) => (name in params ? params[name] : fallback),
		getCredentials: async () => ({ apiKey: 'msl_live_TEST', baseUrl: BASE }),
		getNode: () => ({ name: 'My Store Locator', type: 'test', typeVersion: 1, parameters: {} }),
		getMode: () => mode,
		getWorkflowStaticData: () => staticData,
		continueOnFail: () => false,
		helpers: {
			httpRequestWithAuthentication: async (cred, opts) => {
				assert.strictEqual(cred, 'myStoreLocatorApi');
				calls.push(opts);
				return responder(opts);
			},
			returnJsonArray: (rows) => rows.map((json) => ({ json })),
		},
	};
}

test('credential: Bearer header and /me test', () => {
	const c = new MyStoreLocatorApi();
	assert.strictEqual(c.authenticate.properties.headers.Authorization, '=Bearer {{$credentials.apiKey}}');
	assert.strictEqual(c.test.request.url, '/me');
});

test('location create sends name, city, additional fields and maps', async () => {
	const node = new MyStoreLocator();
	const c = ctx({
		params: { resource: 'location', operation: 'create', name: 'Shop', city: 'Paderborn', additionalFields: { country: 'de', lat: 51.7, tags: 'a, b', phone: '' }, maps: [7] },
		responder: (o) => ({ id: 1, ...o.body }),
	});
	const [out] = await node.execute.call(c);
	assert.strictEqual(c.calls[0].method, 'POST');
	assert.strictEqual(c.calls[0].url, `${BASE}/locations`);
	assert.deepStrictEqual(c.calls[0].body, { name: 'Shop', city: 'Paderborn', country: 'DE', lat: 51.7, tags: ['a', 'b'], maps: [7] });
	assert.strictEqual(out[0].json.id, 1);
});

test('location update refuses an empty change, patches otherwise', async () => {
	const node = new MyStoreLocator();
	const empty = ctx({ params: { resource: 'location', operation: 'update', locationId: '5', updateFields: {} }, responder: () => ({}) });
	await assert.rejects(node.execute.call(empty), /at least one field/);
	const c = ctx({ params: { resource: 'location', operation: 'update', locationId: '5', updateFields: { phone: '123' } }, responder: (o) => ({ id: 5, ...o.body }) });
	await node.execute.call(c);
	assert.strictEqual(c.calls[0].method, 'PATCH');
	assert.strictEqual(c.calls[0].url, `${BASE}/locations/5`);
});

test('location archive calls DELETE', async () => {
	const c = ctx({ params: { resource: 'location', operation: 'archive', locationId: '9' }, responder: () => ({ id: 9, deleted: true }) });
	const [out] = await new MyStoreLocator().execute.call(c);
	assert.strictEqual(c.calls[0].method, 'DELETE');
	assert.deepStrictEqual(out[0].json, { id: 9, deleted: true });
});

test('location getAll paginates with limit/offset and filters', async () => {
	const rows = Array.from({ length: 1200 }, (_, i) => ({ id: i + 1 }));
	const c = ctx({
		params: { resource: 'location', operation: 'getAll', returnAll: true, filters: { city: 'Berlin', q: '' } },
		responder: (o) => ({ data: rows.slice(o.qs.offset, o.qs.offset + o.qs.limit), total: rows.length }),
	});
	const [out] = await new MyStoreLocator().execute.call(c);
	assert.strictEqual(out.length, 1200);
	assert.strictEqual(c.calls.length, 3);
	assert.strictEqual(c.calls[0].qs.city, 'Berlin');
	assert.ok(!('q' in c.calls[0].qs));
});

test('maps getMany returns the data array', async () => {
	const c = ctx({ params: { resource: 'map', operation: 'getAll' }, responder: () => ({ data: [{ id: 7, token: 'abcDEF' }] }) });
	const [out] = await new MyStoreLocator().execute.call(c);
	assert.strictEqual(c.calls[0].url, `${BASE}/maps`);
	assert.strictEqual(out[0].json.token, 'abcDEF');
});

test('polling trigger: new location uses sort/sinceId (one request per poll)', async () => {
	const trig = new MyStoreLocatorTrigger();
	let rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
	const responder = (o) => {
		if (o.qs.sort === '-id') return { data: [...rows].reverse().slice(0, o.qs.limit) };
		assert.strictEqual(o.qs.sort, 'id');
		return { data: rows.filter((r) => r.id > o.qs.sinceId).slice(0, o.qs.limit) };
	};
	const staticData = {};
	let c = ctx({ params: { event: 'newLocation' }, responder, staticData });
	assert.strictEqual(await trig.poll.call(c), null);   // first run: baseline = newest id
	assert.strictEqual(staticData.lastLocationId, 3);
	rows = [...rows, { id: 4 }, { id: 5 }];
	c = ctx({ params: { event: 'newLocation' }, responder, staticData });
	const out = await trig.poll.call(c);
	assert.strictEqual(c.calls.length, 1);
	assert.strictEqual(c.calls[0].qs.sinceId, 3);
	assert.deepStrictEqual(out[0].map((r) => r.json.id), [4, 5]);
	assert.strictEqual(await trig.poll.call(ctx({ params: { event: 'newLocation' }, responder, staticData })), null);
});

test('polling trigger: new lead', async () => {
	const trig = new MyStoreLocatorTrigger();
	let leads = [{ id: 10 }];
	const responder = () => ({ data: leads });
	const staticData = {};
	await trig.poll.call(ctx({ params: { event: 'newLead' }, responder, staticData }));
	leads = [{ id: 12 }, { id: 11 }, { id: 10 }];
	const out = await trig.poll.call(ctx({ params: { event: 'newLead' }, responder, staticData }));
	assert.deepStrictEqual(out[0].map((r) => r.json.id), [11, 12]);
});

test('polling trigger: updated location dedupes the boundary timestamp', async () => {
	const trig = new MyStoreLocatorTrigger();
	const t1 = '2026-10-20T10:00:00.000Z', t2 = '2026-10-21T10:00:00.000Z';
	const staticData = { lastUpdated: t1, lastUpdatedIds: [1] };
	const responder = () => ({ data: [{ id: 1, updated: t1 }, { id: 2, updated: t2 }] });
	const c = ctx({ params: { event: 'updatedLocation' }, responder, staticData });
	const out = await trig.poll.call(c);
	assert.strictEqual(c.calls[0].qs.updatedSince, t1);
	assert.strictEqual(c.calls[0].qs.sort, 'updated');
	assert.deepStrictEqual(out[0].map((r) => r.json.id), [2]);
	assert.strictEqual(staticData.lastUpdated, t2);
});

test('webhook signature check', () => {
	const body = JSON.stringify({ id: 'evt_1', event: 'location.created', data: { id: 1 } });
	const t = Math.floor(Date.now() / 1000);
	const sig = crypto.createHmac('sha256', 'whsec').update(`${t}.${body}`).digest('hex');
	assert.ok(verifySignature('whsec', `t=${t},sha256=${sig}`, body));
	assert.ok(!verifySignature('other', `t=${t},sha256=${sig}`, body));
	assert.ok(!verifySignature('whsec', `t=${t - 3600},sha256=${sig}`, body));
	assert.ok(!verifySignature('whsec', '', body));
});

function hookCtx({ responder, staticData = {}, params = { events: ['location.created'] } }) {
	const calls = [];
	return {
		calls,
		getWorkflowStaticData: () => staticData,
		getNodeWebhookUrl: () => 'https://n8n.example.com/webhook/abc/mystorelocator',
		getNodeParameter: (n, f) => (n in params ? params[n] : f),
		getWorkflow: () => ({ name: 'Sync stores' }),
		getNode: () => ({ name: 'MSL Webhook', type: 'test', typeVersion: 1, parameters: {} }),
		getCredentials: async () => ({ apiKey: 'msl_live_TEST', baseUrl: BASE }),
		helpers: { httpRequestWithAuthentication: async (_c, o) => { calls.push(o); return responder(o); } },
	};
}

test('webhook lifecycle: create stores id + secret, checkExists, delete (404 = gone)', async () => {
	const m = new MyStoreLocatorWebhookTrigger().webhookMethods.default;
	const staticData = {};
	let c = hookCtx({ staticData, responder: (o) => ({ id: 42, secret: 'whsec_1', ...o.body }) });
	assert.strictEqual(await m.create.call(c), true);
	assert.strictEqual(c.calls[0].method, 'POST');
	assert.strictEqual(c.calls[0].url, `${BASE}/webhooks`);
	assert.deepStrictEqual(c.calls[0].body.events, ['location.created']);
	assert.strictEqual(c.calls[0].body.url, 'https://n8n.example.com/webhook/abc/mystorelocator');
	assert.match(c.calls[0].body.name, /n8n – Sync stores/);
	assert.deepStrictEqual(staticData, { webhookId: 42, secret: 'whsec_1' });

	c = hookCtx({ staticData, responder: () => ({ data: [{ id: 42, url: 'https://n8n.example.com/webhook/abc/mystorelocator', active: true }] }) });
	assert.strictEqual(await m.checkExists.call(c), true);
	c = hookCtx({ staticData: { ...staticData }, responder: () => ({ data: [] }) });
	assert.strictEqual(await m.checkExists.call(c), false);

	c = hookCtx({ staticData, responder: () => { const e = new Error('Not found'); e.httpCode = '404'; throw e; } });
	assert.strictEqual(await m.delete.call(c), true);
	assert.strictEqual(c.calls[0].method, 'DELETE');
	assert.strictEqual(c.calls[0].url, `${BASE}/webhooks/42`);
	assert.deepStrictEqual(staticData, {});
});

test('webhook trigger checks the signature with the stored secret and filters events', async () => {
	const node = new MyStoreLocatorWebhookTrigger();
	const body = { id: 'evt_1', event: 'lead.created', data: { id: 3 } };
	const raw = JSON.stringify(body);
	const t = Math.floor(Date.now() / 1000);
	const good = `t=${t},sha256=${crypto.createHmac('sha256', 's3cret').update(`${t}.${raw}`).digest('hex')}`;
	let status = 0;
	const make = (events, header, secret = 's3cret') => ({
		getRequestObject: () => ({ headers: { 'x-msl-signature': header }, rawBody: Buffer.from(raw) }),
		getResponseObject: () => ({ status: (s) => { status = s; return { json: () => {} }; } }),
		getWorkflowStaticData: () => ({ webhookId: 1, secret }),
		getNodeParameter: (n, f) => (n === 'events' ? events : f),
		getBodyData: () => body,
		helpers: { returnJsonArray: (rows) => rows.map((json) => ({ json })) },
	});
	const ok = await node.webhook.call(make(['lead.created'], good));
	assert.strictEqual(ok.workflowData[0][0].json.data.id, 3);
	const bad = await node.webhook.call(make(['lead.created'], 't=1,sha256=00'));
	assert.ok(bad.noWebhookResponse);
	assert.strictEqual(status, 401);
	const ignored = await node.webhook.call(make(['location.created'], good));
	assert.ok(!ignored.workflowData);
});
