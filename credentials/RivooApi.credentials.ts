import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
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

	// Function form instead of the generic one: an empty X-Api-Version header still
	// reaches the API as `''`, which it rejects with 400 INVALID_API_VERSION, so the
	// header has to be omitted entirely when the field is left blank.
	authenticate = async (
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> => {
		const apiVersion = (credentials.apiVersion as string | undefined)?.trim();

		requestOptions.headers = {
			...requestOptions.headers,
			'X-API-KEY': credentials.apiKey as string,
			...(apiVersion ? { 'X-Api-Version': apiVersion } : {}),
		};

		return requestOptions;
	};

	// GET /company is not reachable with an API key in production, so it reports a
	// valid credential as broken. Sales limits is a cheap read that any key used for
	// the charge operations can reach.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.baseUrl}}',
			url: '/charge/sales-limits',
		},
	};
}
