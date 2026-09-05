import type {
	IDataObject,
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { chargeFields, chargeOperations } from './ChargeDescription';
import { clientFields, clientOperations } from './ClientDescription';
import { refundFields, refundOperations } from './RefundDescription';

/**
 * Part of the Rivoo API answers with a `{ status, message, data }` envelope and
 * part answers with the raw DTO, depending on the contract version the company is
 * pinned to. Unwrap the envelope so downstream nodes always see the payload.
 */
async function simplifyEnvelope(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	_response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const simplify = this.getNodeParameter('simplify', true) as boolean;
	if (!simplify) return items;

	const unwrapped: INodeExecutionData[] = [];

	for (const item of items) {
		const json = item.json as IDataObject;
		const isEnvelope =
			json !== null &&
			typeof json === 'object' &&
			!Array.isArray(json) &&
			'data' in json &&
			'status' in json &&
			'message' in json;

		if (!isEnvelope) {
			unwrapped.push(item);
			continue;
		}

		const data = json.data;

		if (Array.isArray(data)) {
			for (const entry of data) {
				unwrapped.push({ json: entry as IDataObject, pairedItem: item.pairedItem });
			}
		} else if (data !== null && typeof data === 'object') {
			unwrapped.push({ json: data as IDataObject, pairedItem: item.pairedItem });
		} else {
			unwrapped.push(item);
		}
	}

	return unwrapped;
}

export class Rivoo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Rivoo',
		name: 'rivoo',
		icon: 'file:rivoo.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Create PIX charges, refunds and clients in RivooPay',
		defaults: {
			name: 'Rivoo',
		},
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'rivooApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Charge',
						value: 'charge',
					},
					{
						name: 'Client',
						value: 'client',
					},
					{
						name: 'Refund',
						value: 'refund',
					},
				],
				default: 'charge',
			},

			...chargeOperations,
			...chargeFields,
			...clientOperations,
			...clientFields,
			...refundOperations,
			...refundFields,

			{
				displayName: 'Simplify',
				name: 'simplify',
				type: 'boolean',
				default: true,
				description:
					'Whether to return only the payload of responses wrapped in a status/message/data envelope',
				routing: {
					output: {
						postReceive: [simplifyEnvelope],
					},
				},
			},
		],
	};
}
