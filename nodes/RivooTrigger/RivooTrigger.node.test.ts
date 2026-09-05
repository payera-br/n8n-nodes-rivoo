import { createHmac } from 'node:crypto';

import type { IDataObject, IWebhookFunctions, IWebhookResponseData } from 'n8n-workflow';

import { RivooTrigger } from './RivooTrigger.node';

const SECRET = 'whsec_test';

const payload = {
	event: 'charge.paid',
	data: { chargeId: 'charge_1', total: 1500 },
	timestamp: '2026-09-04T12:00:00.000Z',
};

const sign = (body: string, secret = SECRET) =>
	`sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

interface Context {
	response: { status: jest.Mock; send: jest.Mock };
	webhook: () => Promise<IWebhookResponseData>;
}

function buildContext(options: {
	events?: string[];
	verifySignature?: boolean;
	registerWebhook?: boolean;
	signature?: string;
	eventHeader?: string;
	rawBody?: Buffer;
	staticSecret?: string;
	credentialSecret?: string;
}): Context {
	const rawBody = options.rawBody ?? Buffer.from(JSON.stringify(payload));
	const send = jest.fn();
	const status = jest.fn(() => ({ send }));
	const response = { status, send };

	const parameters: IDataObject = {
		events: options.events ?? ['charge.paid'],
		verifySignature: options.verifySignature ?? true,
		registerWebhook: options.registerWebhook ?? true,
	};

	const context = {
		getHeaderData: () => ({
			'x-webhook-event': options.eventHeader ?? 'charge.paid',
			'x-webhook-signature': options.signature ?? sign(rawBody.toString()),
			'x-webhook-delivery': 'dlv_1',
			'x-webhook-timestamp': payload.timestamp,
		}),
		getBodyData: () => payload as unknown as IDataObject,
		getNodeParameter: (name: string, fallback?: unknown) =>
			name in parameters ? parameters[name] : fallback,
		getRequestObject: () => ({ rawBody }),
		getResponseObject: () => response,
		getWorkflowStaticData: () => ({
			webhookSecret: options.staticSecret ?? SECRET,
		}),
		getCredentials: async () => ({ secret: options.credentialSecret ?? SECRET }),
		helpers: {
			returnJsonArray: (items: IDataObject[]) => items.map((json) => ({ json })),
		},
	} as unknown as IWebhookFunctions;

	const node = new RivooTrigger();

	return { response, webhook: () => node.webhook.call(context) };
}

describe('RivooTrigger', () => {
	it('emits the delivery when the signature matches', async () => {
		const { webhook } = buildContext({});

		const result = await webhook();

		expect(result.workflowData?.[0][0].json).toEqual({
			event: 'charge.paid',
			deliveryId: 'dlv_1',
			timestamp: payload.timestamp,
			body: payload,
		});
	});

	it('answers 401 and starts no execution when the signature does not match', async () => {
		const { response, webhook } = buildContext({ signature: `sha256=${'0'.repeat(64)}` });

		const result = await webhook();

		expect(response.status).toHaveBeenCalledWith(401);
		expect(result).toEqual({ noWebhookResponse: true });
	});

	it('answers 401 when the signature is computed over a different body', async () => {
		const { response, webhook } = buildContext({
			signature: sign(JSON.stringify({ ...payload, data: { chargeId: 'other' } })),
		});

		await webhook();

		expect(response.status).toHaveBeenCalledWith(401);
	});

	it('verifies against the raw bytes rather than the re-serialized body', async () => {
		// Same JSON, different key order: re-serializing the parsed body would
		// produce a different HMAC and reject a legitimate delivery.
		const raw = Buffer.from(
			JSON.stringify({
				timestamp: payload.timestamp,
				data: payload.data,
				event: payload.event,
			}),
		);
		const { webhook } = buildContext({ rawBody: raw, signature: sign(raw.toString()) });

		const result = await webhook();

		expect(result.workflowData).toBeDefined();
	});

	it('acknowledges events the node does not listen to without starting an execution', async () => {
		const { webhook } = buildContext({
			events: ['charge.expired'],
			eventHeader: 'charge.paid',
		});

		expect(await webhook()).toEqual({});
	});

	it('accepts every event when no event is selected', async () => {
		const { webhook } = buildContext({ events: [], eventHeader: 'subscription.authorized' });

		const result = await webhook();

		expect(result.workflowData?.[0][0].json).toMatchObject({ event: 'subscription.authorized' });
	});

	it('skips verification when the toggle is off', async () => {
		const { webhook } = buildContext({
			verifySignature: false,
			signature: 'sha256=nonsense',
		});

		expect((await webhook()).workflowData).toBeDefined();
	});

	it('falls back to the credential secret in manual registration mode', async () => {
		const { webhook, response } = buildContext({
			registerWebhook: false,
			staticSecret: 'whsec_stale_from_a_previous_registration',
			credentialSecret: SECRET,
		});

		const result = await webhook();

		expect(response.status).not.toHaveBeenCalled();
		expect(result.workflowData).toBeDefined();
	});
});
