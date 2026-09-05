import type { INodeProperties } from 'n8n-workflow';

const showFor = (operation: string[]) => ({
	show: {
		resource: ['charge'],
		operation,
	},
});

export const chargeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['charge'] } },
		options: [
			{
				name: 'Create Payment Link',
				value: 'createPaymentLink',
				description: 'Create a checkout link for a charge',
				action: 'Create a payment link',
				routing: {
					request: {
						method: 'POST',
						url: '/charge/payment-link',
					},
				},
			},
			{
				name: 'Create PIX Charge',
				value: 'createPix',
				description: 'Create a standalone PIX charge with BR Code and QR Code',
				action: 'Create a PIX charge',
				routing: {
					request: {
						method: 'POST',
						url: '/charge/pix',
					},
				},
			},
			{
				name: 'Create Static PIX QR Code',
				value: 'createStaticPix',
				description: 'Create a fixed-amount static PIX QR Code for counter use',
				action: 'Create a static PIX QR code',
				routing: {
					request: {
						method: 'POST',
						url: '/charge/pix/static',
					},
				},
			},
			{
				name: 'Duplicate',
				value: 'duplicate',
				description: 'Create a new charge with the same data as an existing one',
				action: 'Duplicate a charge',
				routing: {
					request: {
						method: 'POST',
						url: '=/charge/duplicate/{{$parameter["chargeId"]}}',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a charge by ID',
				action: 'Get a charge',
				routing: {
					request: {
						method: 'GET',
						url: '=/charge/{{$parameter["chargeId"]}}',
					},
				},
			},
			{
				name: 'Get Sales Limits',
				value: 'getSalesLimits',
				description: 'Retrieve the monthly sales limit status of the account',
				action: 'Get sales limits',
				routing: {
					request: {
						method: 'GET',
						url: '/charge/sales-limits',
					},
				},
			},
			{
				name: 'Get Status',
				value: 'getStatus',
				description: 'Retrieve only the status fields of a charge, for polling',
				action: 'Get a charge status',
				routing: {
					request: {
						method: 'GET',
						url: '=/charge/{{$parameter["chargeId"]}}/status',
					},
				},
			},
		],
		default: 'createPix',
	},
];

const customerFields: INodeProperties = {
	displayName: 'Customer',
	name: 'customer',
	type: 'collection',
	placeholder: 'Add Customer Field',
	default: {},
	description:
		'Customer data. When sent, name, tax ID, email and phone are all required by the API.',
	options: [
		{
			displayName: 'Address',
			name: 'address',
			type: 'string',
			default: '',
			routing: { send: { type: 'body', property: 'customer.address' } },
		},
		{
			displayName: 'Complement',
			name: 'line1',
			type: 'string',
			default: '',
			routing: { send: { type: 'body', property: 'customer.line1' } },
		},
		{
			displayName: 'District',
			name: 'district',
			type: 'string',
			default: '',
			routing: { send: { type: 'body', property: 'customer.district' } },
		},
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			placeholder: 'name@email.com',
			default: '',
			routing: { send: { type: 'body', property: 'customer.email' } },
		},
		{
			displayName: 'Name',
			name: 'name',
			type: 'string',
			default: '',
			routing: { send: { type: 'body', property: 'customer.name' } },
		},
		{
			displayName: 'Number',
			name: 'number',
			type: 'string',
			default: '',
			routing: { send: { type: 'body', property: 'customer.number' } },
		},
		{
			displayName: 'Phone',
			name: 'phone',
			type: 'string',
			default: '',
			placeholder: '11999999999',
			routing: { send: { type: 'body', property: 'customer.phone' } },
		},
		{
			displayName: 'Postal Code',
			name: 'postalCode',
			type: 'string',
			default: '',
			routing: { send: { type: 'body', property: 'customer.postalCode' } },
		},
		{
			displayName: 'Tax ID',
			name: 'taxId',
			type: 'string',
			default: '',
			description: 'CPF or CNPJ, digits only',
			routing: { send: { type: 'body', property: 'customer.taxId' } },
		},
	],
};

export const chargeFields: INodeProperties[] = [
	// ---------------------------------------------------------------------------
	//                            charge:createPaymentLink
	// ---------------------------------------------------------------------------
	{
		displayName: 'Total (Cents)',
		name: 'total',
		type: 'number',
		default: 1000,
		required: true,
		typeOptions: { minValue: 100 },
		description: 'Total amount in cents. Minimum 100 (R$ 1,00).',
		displayOptions: showFor(['createPaymentLink']),
		routing: { send: { type: 'body', property: 'total' } },
	},
	{
		...customerFields,
		displayOptions: showFor(['createPaymentLink', 'createPix']),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor(['createPaymentLink']),
		options: [
			{
				displayName: 'Customer ID',
				name: 'customerId',
				type: 'string',
				default: '',
				description: 'ID of an existing client, used instead of inline customer data',
				routing: { send: { type: 'body', property: 'customerId' } },
			},
			{
				displayName: 'Dev Mode',
				name: 'devMode',
				type: 'boolean',
				default: false,
				description: 'Whether the charge is created in development mode',
				routing: { send: { type: 'body', property: 'devMode' } },
			},
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'Your own identifier, used to correlate the charge with your system',
				routing: { send: { type: 'body', property: 'externalId' } },
			},
			{
				displayName: 'Failed URL',
				name: 'failedUrl',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'failedUrl' } },
			},
			{
				displayName: 'Idempotency Key',
				name: 'idempotencyKey',
				type: 'string',
				default: '',
				description:
					'Replays the first response for 24h when the same key is reused with the same payload',
				routing: { request: { headers: { 'Idempotency-Key': '={{$value}}' } } },
			},
			{
				displayName: 'Needs Shipping',
				name: 'needShipping',
				type: 'boolean',
				default: false,
				description: 'Whether the checkout should collect shipping data',
				routing: { send: { type: 'body', property: 'needShipping' } },
			},
			{
				displayName: 'Notify Customer',
				name: 'notifyCustomer',
				type: 'boolean',
				default: false,
				description: 'Whether Payera should notify the customer about the charge',
				routing: { send: { type: 'body', property: 'notifyCustomer' } },
			},
			{
				displayName: 'Success URL',
				name: 'successUrl',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'successUrl' } },
			},
		],
	},
	{
		displayName: 'Items',
		name: 'items',
		type: 'fixedCollection',
		placeholder: 'Add Item',
		typeOptions: { multipleValues: true },
		default: {},
		displayOptions: showFor(['createPaymentLink']),
		description: 'Products charged. When set, the total is calculated from the products.',
		options: [
			{
				displayName: 'Item',
				name: 'item',
				values: [
					{
						displayName: 'Product ID',
						name: 'productId',
						type: 'string',
						default: '',
						required: true,
					},
					{
						displayName: 'Quantity',
						name: 'quantity',
						type: 'number',
						default: 1,
						typeOptions: { minValue: 1 },
					},
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'items',
				value: '={{ $value.item }}',
			},
		},
	},

	// ---------------------------------------------------------------------------
	//                               charge:createPix
	// ---------------------------------------------------------------------------
	{
		displayName: 'Amount (Cents)',
		name: 'amount',
		type: 'number',
		default: 1000,
		required: true,
		typeOptions: { minValue: 100 },
		description: 'Amount in cents. Minimum 100 (R$ 1,00).',
		displayOptions: showFor(['createPix']),
		routing: { send: { type: 'body', property: 'amount' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor(['createPix']),
		options: [
			{
				displayName: 'Dev Mode',
				name: 'devMode',
				type: 'boolean',
				default: false,
				description: 'Whether the charge is created in development mode',
				routing: { send: { type: 'body', property: 'devMode' } },
			},
			{
				displayName: 'Expires In (Seconds)',
				name: 'expiresIn',
				type: 'number',
				default: 1800,
				typeOptions: { minValue: 60 },
				description: 'Expiration in seconds. Defaults to 1800 (30 minutes).',
				routing: { send: { type: 'body', property: 'expiresIn' } },
			},
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'Your own identifier, used to correlate the charge with your system',
				routing: { send: { type: 'body', property: 'externalId' } },
			},
			{
				displayName: 'Idempotency Key',
				name: 'idempotencyKey',
				type: 'string',
				default: '',
				description:
					'Replays the first response for 24h when the same key is reused with the same payload',
				routing: { request: { headers: { 'Idempotency-Key': '={{$value}}' } } },
			},
		],
	},

	// ---------------------------------------------------------------------------
	//                            charge:createStaticPix
	// ---------------------------------------------------------------------------
	{
		displayName: 'Amount (Cents)',
		name: 'amount',
		type: 'number',
		default: 1000,
		required: true,
		typeOptions: { minValue: 0 },
		description: 'Fixed amount in cents encoded in the static QR Code',
		displayOptions: showFor(['createStaticPix']),
		routing: { send: { type: 'body', property: 'amount' } },
	},

	// ---------------------------------------------------------------------------
	//                        charge:get / getStatus / duplicate
	// ---------------------------------------------------------------------------
	{
		displayName: 'Charge ID',
		name: 'chargeId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'charge_123456',
		displayOptions: showFor(['get', 'getStatus', 'duplicate']),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor(['duplicate']),
		options: [
			{
				displayName: 'Idempotency Key',
				name: 'idempotencyKey',
				type: 'string',
				default: '',
				description:
					'Replays the first response for 24h when the same key is reused with the same payload',
				routing: { request: { headers: { 'Idempotency-Key': '={{$value}}' } } },
			},
		],
	},
];
