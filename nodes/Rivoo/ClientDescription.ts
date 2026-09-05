import type { INodeProperties } from 'n8n-workflow';

const addressOptions: INodeProperties[] = [
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		routing: { send: { type: 'body', property: 'address' } },
	},
	{
		displayName: 'Complement',
		name: 'line1',
		type: 'string',
		default: '',
		routing: { send: { type: 'body', property: 'line1' } },
	},
	{
		displayName: 'District',
		name: 'district',
		type: 'string',
		default: '',
		routing: { send: { type: 'body', property: 'district' } },
	},
	{
		displayName: 'Number',
		name: 'number',
		type: 'string',
		default: '',
		routing: { send: { type: 'body', property: 'number' } },
	},
	{
		displayName: 'Postal Code',
		name: 'postalCode',
		type: 'string',
		default: '',
		placeholder: '80215100',
		routing: { send: { type: 'body', property: 'postalCode' } },
	},
];

export const clientOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['client'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a client for the authenticated company',
				action: 'Create a client',
				routing: {
					request: {
						method: 'POST',
						url: '/client',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a client by ID',
				action: 'Get a client',
				routing: {
					request: {
						method: 'GET',
						url: '=/client/id/{{$parameter["clientId"]}}',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'List every client of the company',
				action: 'Get many clients',
				routing: {
					request: {
						method: 'GET',
						url: '/client',
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an existing client',
				action: 'Update a client',
				routing: {
					request: {
						method: 'PUT',
						url: '/client',
					},
				},
			},
		],
		default: 'create',
	},
];

export const clientFields: INodeProperties[] = [
	// ---------------------------------------------------------------------------
	//                                 client:get
	// ---------------------------------------------------------------------------
	{
		displayName: 'Client ID',
		name: 'clientId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'clnt_clx1234567890abcdef',
		displayOptions: { show: { resource: ['client'], operation: ['get'] } },
	},

	// ---------------------------------------------------------------------------
	//                                client:create
	// ---------------------------------------------------------------------------
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['client'], operation: ['create'] } },
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'Tax ID',
		name: 'taxId',
		type: 'string',
		default: '',
		required: true,
		description: 'CPF or CNPJ. Non-numeric characters are stripped by the API.',
		displayOptions: { show: { resource: ['client'], operation: ['create'] } },
		routing: { send: { type: 'body', property: 'taxId' } },
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['client'], operation: ['create'] } },
		routing: { send: { type: 'body', property: 'email' } },
	},
	{
		displayName: 'Phone',
		name: 'phone',
		type: 'string',
		default: '',
		required: true,
		placeholder: '41999999999',
		displayOptions: { show: { resource: ['client'], operation: ['create'] } },
		routing: { send: { type: 'body', property: 'phone' } },
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		options: [
			{ name: 'Active', value: 'ACTIVE' },
			{ name: 'Inactive', value: 'INACTIVE' },
		],
		default: 'ACTIVE',
		displayOptions: { show: { resource: ['client'], operation: ['create'] } },
		routing: { send: { type: 'body', property: 'status' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['client'], operation: ['create'] } },
		options: addressOptions,
	},

	// ---------------------------------------------------------------------------
	//                                client:update
	// ---------------------------------------------------------------------------
	{
		displayName: 'Client ID',
		name: 'clientId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'clnt_clx1234567890abcdef',
		displayOptions: { show: { resource: ['client'], operation: ['update'] } },
		routing: { send: { type: 'body', property: 'id' } },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['client'], operation: ['update'] } },
		options: [
			...addressOptions,
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				routing: { send: { type: 'body', property: 'email' } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'name' } },
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'phone' } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Active', value: 'ACTIVE' },
					{ name: 'Inactive', value: 'INACTIVE' },
				],
				default: 'ACTIVE',
				routing: { send: { type: 'body', property: 'status' } },
			},
			{
				displayName: 'Tax ID',
				name: 'taxId',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'taxId' } },
			},
		],
	},
];
