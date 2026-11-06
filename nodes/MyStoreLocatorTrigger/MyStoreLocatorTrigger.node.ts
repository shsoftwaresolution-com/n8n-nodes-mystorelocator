import {
	NodeConnectionTypes,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type IPollFunctions,
} from 'n8n-workflow';
import { mslApiRequest } from '../shared/transport';

const PAGE = 500;
const MAX_PAGES = 20;

/**
 * Polling trigger (no webhook needed):
 * - new location: sort=id&sinceId=<last seen id> (one request per 500 new rows)
 * - updated location: sort=updated&updatedSince=<last seen updated> (pages by time)
 * - new lead: /leads is sorted newest first → everything above the last seen id
 * For real-time events use the "My Store Locator Webhook Trigger" node (registers a webhook automatically).
 */
export class MyStoreLocatorTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'My Store Locator Trigger',
		name: 'myStoreLocatorTrigger',
		icon: { light: 'file:../../icons/mystorelocator.svg', dark: 'file:../../icons/mystorelocator.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts the workflow when locations or enquiries are added or changed (polling)',
		defaults: { name: 'My Store Locator Trigger' },
		polling: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'myStoreLocatorApi', required: true }],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{ name: 'New Lead', value: 'newLead', description: 'A visitor sent an enquiry through a map' },
					{ name: 'New Location', value: 'newLocation', description: 'A location was added' },
					{ name: 'Updated Location', value: 'updatedLocation', description: 'A location was changed (also fires for new ones)' },
				],
				default: 'newLocation',
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const event = this.getNodeParameter('event') as string;
		const state = this.getWorkflowStaticData('node');
		const manual = this.getMode() === 'manual';
		let rows: IDataObject[] = [];

		if (event === 'newLead') {
			const res = await mslApiRequest.call(this, 'GET', '/leads', { limit: manual ? 1 : 100, offset: 0 });
			const leads = (res.data as IDataObject[]) || [];
			if (manual) return leads.length ? [this.helpers.returnJsonArray(leads)] : null;
			const last = Number(state.lastLeadId || 0);
			const maxId = leads.reduce((m, l) => Math.max(m, Number(l.id)), last);
			if (state.lastLeadId === undefined) { state.lastLeadId = maxId; return null; }   // first activation: start from now
			rows = leads.filter((l) => Number(l.id) > last).reverse();
			state.lastLeadId = maxId;
		} else if (event === 'newLocation') {
			// newest first for the baseline / test, then sinceId = last seen id, ascending
			if (manual || state.lastLocationId === undefined) {
				const res = await mslApiRequest.call(this, 'GET', '/locations', { sort: '-id', limit: 1 });
				const newest = ((res.data as IDataObject[]) || [])[0];
				if (manual) return newest ? [this.helpers.returnJsonArray([newest])] : null;
				state.lastLocationId = newest ? Number(newest.id) : 0;
				return null;
			}
			const last = Number(state.lastLocationId);
			for (let page = 0, sinceId = last; page < MAX_PAGES; page++) {
				const res = await mslApiRequest.call(this, 'GET', '/locations', { sort: 'id', sinceId, limit: PAGE });
				const list = (res.data as IDataObject[]) || [];
				rows.push(...list);
				if (list.length < PAGE) break;
				sinceId = Number(list[list.length - 1].id);
			}
			state.lastLocationId = rows.reduce((m, l) => Math.max(m, Number(l.id)), last);
		} else {
			// sort=updated + updatedSince pages by time, so nothing is skipped; ties at the boundary are deduplicated by id
			if (manual) {
				const res = await mslApiRequest.call(this, 'GET', '/locations', { sort: '-updated', limit: 1 });
				const newest = (res.data as IDataObject[]) || [];
				return newest.length ? [this.helpers.returnJsonArray(newest)] : null;
			}
			const since = (state.lastUpdated as string) || new Date().toISOString();
			const seen = new Set((state.lastUpdatedIds as number[]) || []);
			const list: IDataObject[] = [];
			for (let offset = 0, page = 0; page < MAX_PAGES; page++) {
				const res = await mslApiRequest.call(this, 'GET', '/locations', { sort: 'updated', updatedSince: since, limit: PAGE, offset });
				const data = (res.data as IDataObject[]) || [];
				list.push(...data);
				offset += data.length;
				if (data.length < PAGE) break;
			}
			rows = list.filter((l) => !(String(l.updated) === since && seen.has(Number(l.id))));
			const newest = list.length ? String(list[list.length - 1].updated) : since;
			state.lastUpdated = newest;
			state.lastUpdatedIds = list.filter((l) => String(l.updated) === newest).map((l) => Number(l.id));
		}

		return rows.length ? [this.helpers.returnJsonArray(rows)] : null;
	}
}
