import { createHmac, timingSafeEqual } from 'node:crypto';

import type {
	IDataObject,
	IHookFunctions,
	IHttpRequestMethods,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

const EVENT_HEADER = 'x-webhook-event';
const SIGNATURE_HEADER = 'x-webhook-signature';
const DELIVERY_HEADER = 'x-webhook-delivery';
const TIMESTAMP_HEADER = 'x-webhook-timestamp';

const ALL_EVENTS = [
	'charge.pending',
	'charge.processing',
	'charge.paid',
	'charge.received',
	'charge.expired',
	'subscription.authorized',
	'subscription.rejected',
	'subscription.charge.paid',
	'subscription.charge.failed',
];

interface RivooWebhook {
	id: string;
	url: string;
	name: string;
	events: string[];
	secret?: string;
}

interface RivooStaticData {
	webhookId?: string;
	webhookSecret?: string;
	webhookUrl?: string;
}

async function rivooApiRequest(
	this: IHookFunctions,
	method: IHttpRequestMethods,
	resource: string,
	body?: IDataObject,
): Promise<unknown> {
	const credentials = (await this.getCredentials('rivooApi')) as { baseUrl: string };

	try {
		return await this.helpers.httpRequestWithAuthentication.call(this, 'rivooApi', {
			method,
			url: `${credentials.baseUrl.replace(/\/$/, '')}${resource}`,
			body,
			json: true,
			headers: { Accept: 'application/json' },
		});
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

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
		outputs: ['main'],
		credentials: [
			{
				name: 'rivooApi',
				required: true,
				displayOptions: {
					show: {
						registerWebhook: [true],
					},
				},
			},
			{
				name: 'rivooWebhookApi',
				required: true,
				displayOptions: {
					show: {
						registerWebhook: [false],
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
				displayName: 'Register Webhook Automatically',
				name: 'registerWebhook',
				type: 'boolean',
				default: true,
				description:
					'Whether to create the webhook in Rivoo when the workflow is activated and delete it on deactivation. Requires an API key with the webhooks:write scope and a publicly reachable n8n URL.',
			},
			{
				displayName:
					'Register this node\'s production webhook URL in the Rivoo dashboard (or via <code>POST /webhook</code>) and store the signing secret it returns once.',
				name: 'setupNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						registerWebhook: [false],
					},
				},
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [],
				description:
					'Events that start the workflow. Leave empty to subscribe to (and accept) every event.',
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

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				if (!(this.getNodeParameter('registerWebhook', true) as boolean)) return true;

				const staticData = this.getWorkflowStaticData('node') as RivooStaticData;
				if (staticData.webhookId === undefined) return false;

				const webhookUrl = this.getNodeWebhookUrl('default');

				try {
					const webhook = (await rivooApiRequest.call(
						this,
						'GET',
						`/webhook/${staticData.webhookId}`,
					)) as RivooWebhook;

					if (webhook.url === webhookUrl) return true;
				} catch {
					// Deleted on the Rivoo side, or no longer visible to this key.
				}

				delete staticData.webhookId;
				delete staticData.webhookSecret;
				delete staticData.webhookUrl;
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				if (!(this.getNodeParameter('registerWebhook', true) as boolean)) return true;

				const webhookUrl = this.getNodeWebhookUrl('default');
				if (webhookUrl === undefined) {
					throw new NodeOperationError(this.getNode(), 'Could not resolve the webhook URL');
				}

				const selectedEvents = this.getNodeParameter('events', []) as string[];
				const events = selectedEvents.length > 0 ? selectedEvents : ALL_EVENTS;

				const webhook = (await rivooApiRequest.call(this, 'POST', '/webhook', {
					url: webhookUrl,
					name: `n8n: ${this.getWorkflow().name ?? 'workflow'}`,
					events,
				})) as RivooWebhook;

				if (webhook.id === undefined) {
					throw new NodeOperationError(
						this.getNode(),
						'Rivoo did not return an ID for the created webhook',
					);
				}

				const staticData = this.getWorkflowStaticData('node') as RivooStaticData;
				staticData.webhookId = webhook.id;
				staticData.webhookUrl = webhookUrl;
				// Only returned on creation, so it has to be kept for signature checks.
				staticData.webhookSecret = webhook.secret;

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				if (!(this.getNodeParameter('registerWebhook', true) as boolean)) return true;

				const staticData = this.getWorkflowStaticData('node') as RivooStaticData;
				if (staticData.webhookId === undefined) return true;

				try {
					await rivooApiRequest.call(this, 'DELETE', `/webhook/${staticData.webhookId}`);
				} catch {
					// Already gone: nothing left to clean up.
				}

				delete staticData.webhookId;
				delete staticData.webhookSecret;
				delete staticData.webhookUrl;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const headers = this.getHeaderData() as IDataObject;
		const body = this.getBodyData() as IDataObject;
		const events = this.getNodeParameter('events', []) as string[];
		const verifySignature = this.getNodeParameter('verifySignature', true) as boolean;
		const registerWebhook = this.getNodeParameter('registerWebhook', true) as boolean;

		if (verifySignature) {
			const staticData = this.getWorkflowStaticData('node') as RivooStaticData;
			let secret = registerWebhook ? staticData.webhookSecret : undefined;

			if (secret === undefined) {
				const credentials = (await this.getCredentials('rivooWebhookApi')) as { secret: string };
				secret = credentials.secret;
			}

			const signature = (headers[SIGNATURE_HEADER] as string) ?? '';
			const request = this.getRequestObject() as unknown as { rawBody?: Buffer };
			const payload = request.rawBody ?? Buffer.from(JSON.stringify(body));
			const expected = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;

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
