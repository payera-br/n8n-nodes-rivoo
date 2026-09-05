import type { INodeProperties } from 'n8n-workflow';

export const refundOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['refund'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a partial or full refund for a paid charge',
				action: 'Create a refund',
				routing: {
					request: {
						method: 'POST',
						url: '=/refund/{{$parameter["chargeId"]}}',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'List every refund of a charge',
				action: 'Get many refunds',
				routing: {
					request: {
						method: 'GET',
						url: '=/refund/charge/{{$parameter["chargeId"]}}',
					},
				},
			},
		],
		default: 'create',
	},
];

export const refundFields: INodeProperties[] = [
	{
		displayName: 'Charge ID',
		name: 'chargeId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'charge_123456',
		displayOptions: { show: { resource: ['refund'], operation: ['create', 'getAll'] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['refund'], operation: ['create'] } },
		options: [
			{
				displayName: 'Comment',
				name: 'comment',
				type: 'string',
				default: '',
				typeOptions: { maxLength: 140 },
				description: 'Refund comment, up to 140 characters',
				routing: { send: { type: 'body', property: 'comment' } },
			},
			{
				displayName: 'Value (Cents)',
				name: 'value',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 1 },
				description: 'Refund amount in cents. Omit to refund the full available amount.',
				routing: { send: { type: 'body', property: 'value' } },
			},
		],
	},
];
