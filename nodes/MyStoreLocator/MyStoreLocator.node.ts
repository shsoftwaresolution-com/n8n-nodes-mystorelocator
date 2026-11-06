import {
	NodeConnectionTypes,
	NodeApiError,
	NodeOperationError,
	type JsonObject,
	type IDataObject,
	type IExecuteFunctions,
	type ILoadOptionsFunctions,
	type INodeExecutionData,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { mslApiRequest, mslApiRequestAll, toLocationBody } from '../shared/transport';
import { locationProperties } from './LocationDescription';

export class MyStoreLocator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'My Store Locator',
		name: 'myStoreLocator',
		icon: { light: 'file:../../icons/mystorelocator.svg', dark: 'file:../../icons/mystorelocator.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage store locations, maps and enquiries in My Store Locator',
		defaults: { name: 'My Store Locator' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'myStoreLocatorApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Category', value: 'category' },
					{ name: 'Lead', value: 'lead' },
					{ name: 'Location', value: 'location' },
					{ name: 'Map', value: 'map' },
					{ name: 'Status', value: 'status' },
				],
				default: 'location',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['category'] } },
				options: [{ name: 'Get Many', value: 'getAll', action: 'Get many categories', description: 'List many categories (IDs for the Category field)' }],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['status'] } },
				options: [{ name: 'Get Many', value: 'getAll', action: 'Get many statuses', description: 'List many statuses (IDs for the Status field)' }],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['map'] } },
				options: [{ name: 'Get Many', value: 'getAll', action: 'Get many maps', description: 'List many maps with their embed token' }],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['lead'] } },
				options: [{ name: 'Get Many', value: 'getAll', action: 'Get many leads', description: 'List many enquiries sent through your maps, newest first' }],
				default: 'getAll',
			},
			...locationProperties,
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: { show: { resource: ['lead', 'location'], operation: ['getAll'] } },
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: { show: { resource: ['lead', 'location'], operation: ['getAll'], returnAll: [false] } },
				typeOptions: { minValue: 1 },
				default: 50,
				description: 'Max number of results to return',
			},
		],
	};

	methods = {
		loadOptions: {
			async getCategories(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const res = await mslApiRequest.call(this, 'GET', '/categories');
				return ((res.data as IDataObject[]) || []).map((c) => ({ name: String(c.name), value: Number(c.id) }));
			},
			async getStatuses(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const res = await mslApiRequest.call(this, 'GET', '/statuses');
				return ((res.data as IDataObject[]) || []).map((s) => ({ name: String(s.name), value: String(s.id) }));
			},
			async getMaps(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const res = await mslApiRequest.call(this, 'GET', '/maps');
				return ((res.data as IDataObject[]) || []).map((m) => ({ name: String(m.name), value: Number(m.id) }));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const out: INodeExecutionData[] = [];
		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				let result: IDataObject | IDataObject[];

				if (resource === 'location') {
					if (operation === 'create') {
						const body = toLocationBody({
							name: this.getNodeParameter('name', i),
							city: this.getNodeParameter('city', i),
							...(this.getNodeParameter('additionalFields', i, {}) as IDataObject),
						});
						const maps = this.getNodeParameter('maps', i, []) as number[];
						if (maps.length) body.maps = maps.map(Number);
						result = await mslApiRequest.call(this, 'POST', '/locations', {}, body);
					} else if (operation === 'update') {
						const id = this.getNodeParameter('locationId', i) as string;
						const body = toLocationBody(this.getNodeParameter('updateFields', i, {}) as IDataObject);
						if (!Object.keys(body).length) throw new NodeOperationError(this.getNode(), 'Add at least one field to update', { itemIndex: i });
						result = await mslApiRequest.call(this, 'PATCH', `/locations/${encodeURIComponent(id)}`, {}, body);
					} else if (operation === 'get') {
						const id = this.getNodeParameter('locationId', i) as string;
						const qs: IDataObject = this.getNodeParameter('includePhoto', i, false) ? { include: 'photo' } : {};
						result = await mslApiRequest.call(this, 'GET', `/locations/${encodeURIComponent(id)}`, qs);
					} else if (operation === 'archive') {
						const id = this.getNodeParameter('locationId', i) as string;
						result = await mslApiRequest.call(this, 'DELETE', `/locations/${encodeURIComponent(id)}`);
					} else {
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = {};
						for (const [k, v] of Object.entries(filters)) if (v !== '' && v !== undefined && v !== null) qs[k] = v;
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const max = returnAll ? Infinity : (this.getNodeParameter('limit', i) as number);
						result = await mslApiRequestAll.call(this, '/locations', qs, max);
					}
				} else if (resource === 'lead') {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const max = returnAll ? Infinity : (this.getNodeParameter('limit', i) as number);
					result = await mslApiRequestAll.call(this, '/leads', {}, max);
				} else {
					const path = resource === 'category' ? '/categories' : resource === 'status' ? '/statuses' : '/maps';
					result = ((await mslApiRequest.call(this, 'GET', path)).data as IDataObject[]) || [];
				}

				const rows = Array.isArray(result) ? result : [result];
				out.push(...rows.map((json) => ({ json, pairedItem: { item: i } })));
			} catch (error) {
				if (this.continueOnFail()) {
					out.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				if (error instanceof NodeOperationError) {
					throw new NodeOperationError(this.getNode(), error.message, { itemIndex: i });
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}
		return [out];
	}
}

