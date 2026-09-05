import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class RivooApi implements ICredentialType {
	name = 'rivooApi';

	displayName = 'Rivoo API';

	documentationUrl = 'https://api.rivoopay.com/api/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.rivoopay.com',
			description: 'RivooPay API base URL. Use the sandbox host when testing.',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'API key created in the Rivoo dashboard. Sent as the X-API-KEY header.',
			required: true,
		},
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string',
			default: '',
			placeholder: '2025-01-01',
			description:
				'Optional dated contract version sent as X-Api-Version. Leave empty to use the version the company is pinned to.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-KEY': '={{$credentials.apiKey}}',
				// Empty header values are dropped by the HTTP layer, so an unset version
				// falls back to the company pin server-side.
				'X-Api-Version': '={{$credentials.apiVersion}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/company',
		},
	};
}
