import { createHmac, timingSafeEqual } from 'node:crypto';

import type {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

const EVENT_HEADER = 'x-webhook-event';
const SIGNATURE_HEADER = 'x-webhook-signature';
const DELIVERY_HEADER = 'x-webhook-delivery';
const TIMESTAMP_HEADER = 'x-webhook-timestamp';

function safeCompare(received: string, expected: string): boolean {
	const a = Buffer.from(received);
	const b = Buffer.from(expected);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

export class RivooTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Rivoo Trigger',
		name: 'rivooTrigger',
		icon: 'file:rivoo.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '=Events: {{$parameter["events"].join(", ")}}',
		description: 'Starts a workflow when RivooPay delivers a webhook',
		defaults: {
			name: 'Rivoo Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'rivooWebhookApi',
				required: true,
				displayOptions: {
					show: {
						verifySignature: [true],
					},
				},
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
				// Signature is an HMAC over the exact bytes Rivoo sent, so the parsed
				// body cannot be re-serialized for verification.
				rawBody: true,
			},
		],
		properties: [
			{
				displayName:
					'Register the production webhook URL of this node in the Rivoo dashboard (or via <code>POST /webhook</code>) and store the signing secret it returns once.',
				name: 'setupNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [],
				description: 'Events that start the workflow. Leave empty to accept every event.',
				options: [
					{ name: 'Charge Expired', value: 'charge.expired' },
					{ name: 'Charge Paid', value: 'charge.paid' },
					{ name: 'Charge Pending', value: 'charge.pending' },
					{ name: 'Charge Processing', value: 'charge.processing' },
					{ name: 'Charge Received', value: 'charge.received' },
					{ name: 'Subscription Authorized', value: 'subscription.authorized' },
					{ name: 'Subscription Charge Failed', value: 'subscription.charge.failed' },
					{ name: 'Subscription Charge Paid', value: 'subscription.charge.paid' },
					{ name: 'Subscription Rejected', value: 'subscription.rejected' },
				],
			},
			{
				displayName: 'Verify Signature',
				name: 'verifySignature',
				type: 'boolean',
				default: true,
				description:
					'Whether to reject deliveries whose X-Webhook-Signature does not match the signing secret',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const headers = this.getHeaderData() as IDataObject;
		const body = this.getBodyData() as IDataObject;
		const events = this.getNodeParameter('events', []) as string[];
		const verifySignature = this.getNodeParameter('verifySignature', true) as boolean;

		if (verifySignature) {
			const credentials = (await this.getCredentials('rivooWebhookApi')) as { secret: string };
			const signature = (headers[SIGNATURE_HEADER] as string) ?? '';
			const request = this.getRequestObject() as unknown as { rawBody?: Buffer };
			const payload = request.rawBody ?? Buffer.from(JSON.stringify(body));
			const expected = `sha256=${createHmac('sha256', credentials.secret)
				.update(payload)
				.digest('hex')}`;

			if (!safeCompare(signature, expected)) {
				const response = this.getResponseObject();
				response.status(401).send('Invalid signature');
				return { noWebhookResponse: true };
			}
		}

		const event = (headers[EVENT_HEADER] as string) ?? (body.event as string) ?? '';

		// Acknowledge deliveries for events this node does not listen to, so Rivoo
		// does not retry them.
		if (events.length > 0 && event !== '' && !events.includes(event)) {
			return {};
		}

		return {
			workflowData: [
				this.helpers.returnJsonArray([
					{
						event,
						deliveryId: (headers[DELIVERY_HEADER] as string) ?? null,
						timestamp: (headers[TIMESTAMP_HEADER] as string) ?? null,
						body,
					},
				]),
			],
		};
	}
}
