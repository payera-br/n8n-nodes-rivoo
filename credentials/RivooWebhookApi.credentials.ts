import type { ICredentialType, INodeProperties } from 'n8n-workflow';

/**
 * Signing secret returned once by `POST /webhook` when the webhook is created in
 * the Rivoo dashboard/API. Used by the Rivoo Trigger node to verify the
 * `X-Webhook-Signature` header (`sha256=<hex hmac of the raw body>`).
 */
export class RivooWebhookApi implements ICredentialType {
	name = 'rivooWebhookApi';

	displayName = 'Rivoo Webhook Signing Secret API';

	documentationUrl = 'https://api.rivoopay.com/api/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'Signing Secret',
			name: 'secret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			placeholder: 'whsec_...',
			description: 'Secret shown only once when the webhook was created',
			required: true,
		},
	];
}
