import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IPollFunctions,
} from 'n8n-workflow';

export const CREDENTIAL = 'myStoreLocatorApi';
export const DEFAULT_BASE = 'https://app.my-store-locator.com/api/v1/ext';

type Ctx = IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions | IHookFunctions;

/** One request against the Customer API (/api/v1/ext). Auth header comes from the credential. */
export async function mslApiRequest(
	this: Ctx,
	method: IHttpRequestMethods,
	path: string,
	qs: IDataObject = {},
	body: IDataObject | undefined = undefined,
): Promise<IDataObject> {
	const credentials = await this.getCredentials(CREDENTIAL);
	const base = String(credentials.baseUrl || DEFAULT_BASE).replace(/\/+$/, '');
	const options: IHttpRequestOptions = {
		method,
		url: `${base}${path}`,
		qs,
		json: true,
		headers: { Accept: 'application/json' },
	};
	if (body !== undefined) options.body = body;
	return (await this.helpers.httpRequestWithAuthentication.call(this, CREDENTIAL, options)) as IDataObject;
}

/** Reads every page of a list endpoint ({ data, total }) with limit/offset, up to `max` rows. */
export async function mslApiRequestAll(
	this: Ctx,
	path: string,
	qs: IDataObject = {},
	max = Infinity,
): Promise<IDataObject[]> {
	const out: IDataObject[] = [];
	const page = 500;
	let offset = 0;
	for (;;) {
		const limit = Math.min(page, max - out.length);
		const res = await mslApiRequest.call(this, 'GET', path, { ...qs, limit, offset });
		const rows = (res.data as IDataObject[]) || [];
		out.push(...rows);
		offset += rows.length;
		if (rows.length < limit || out.length >= max) break;
		if (typeof res.total === 'number' && offset >= res.total) break;
	}
	return out;
}

const LOCATION_KEYS = [
	'name', 'street', 'zip', 'city', 'state', 'country', 'lat', 'lon', 'phone', 'email', 'website',
	'manager', 'description', 'categoryId', 'status', 'timezone', 'tags',
];

/** Turns the node's field collection into an API body (only filled fields, typed). */
export function toLocationBody(fields: IDataObject): IDataObject {
	const body: IDataObject = {};
	for (const key of LOCATION_KEYS) {
		const v = fields[key];
		if (v === undefined || v === null || v === '') continue;
		if (key === 'lat' || key === 'lon') body[key] = Number(v);
		else if (key === 'categoryId') body[key] = Number.parseInt(String(v), 10);
		else if (key === 'country') body[key] = String(v).toUpperCase();
		else if (key === 'tags') {
			const list: string[] = Array.isArray(v) ? v.map(String) : String(v).split(',');
			body[key] = list.map((t) => t.trim()).filter(Boolean);
		}
		else body[key] = v;
	}
	return body;
}
