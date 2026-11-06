import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class MyStoreLocatorApi implements ICredentialType {
	name = 'myStoreLocatorApi';

	displayName = 'My Store Locator API';

	icon: Icon = { light: 'file:../icons/mystorelocator.svg', dark: 'file:../icons/mystorelocator.dark.svg' };

	documentationUrl =
		'https://github.com/shsoftwaresolution-com/n8n-nodes-mystorelocator?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			placeholder: 'msl_live_…',
			description:
				'Create a key in My Store Locator under "API & Webhooks" (Starter plan or higher). Scopes: locations:read, locations:write, maps:read, leads:read, webhooks:write (webhook trigger).',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://app.my-store-locator.com/api/v1/ext',
			description: 'Only change this for a test or self-hosted instance',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
				'X-MSL-Lang': 'en',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "")}}',
			url: '/me',
			method: 'GET',
		},
	};
}
