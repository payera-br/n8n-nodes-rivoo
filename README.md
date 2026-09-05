# n8n-nodes-rivoo

n8n community node for the [RivooPay](https://api.rivoopay.com/api/docs) payments API.

Two nodes ship in this package:

- **Rivoo** — declarative action node for charges, refunds and clients. Also usable as an AI agent tool.
- **Rivoo Trigger** — webhook trigger that receives Rivoo deliveries and verifies their HMAC signature.

## Install

Self-hosted n8n: **Settings → Community nodes → Install** → `n8n-nodes-rivoo`.

## Credentials

### Rivoo API (`rivooApi`)

| Field | Notes |
| --- | --- |
| Base URL | `https://api.rivoopay.com` by default |
| API Key | sent as `X-API-KEY` |
| API Version | optional, sent as `X-Api-Version`; empty falls back to the company pin |

The credential test calls `GET /company`, so the key needs at least the `company: read` scope.
Each operation needs the scope of its own endpoint (`payments`, `catalog`, `webhooks`).

### Rivoo Webhook Signing Secret (`rivooWebhookApi`)

The `secret` returned once by `POST /webhook`. Used only by the trigger node.

## Operations

| Resource | Operation | Endpoint | Scope |
| --- | --- | --- | --- |
| Charge | Create Payment Link | `POST /charge/payment-link` | `payments: write` |
| Charge | Create PIX Charge | `POST /charge/pix` | `payments: write` |
| Charge | Create Static PIX QR Code | `POST /charge/pix/static` | `payments: write` |
| Charge | Duplicate | `POST /charge/duplicate/{id}` | `payments: write` |
| Charge | Get | `GET /charge/{id}` | public |
| Charge | Get Status | `GET /charge/{id}/status` | public |
| Charge | Get Sales Limits | `GET /charge/sales-limits` | `payments: read` |
| Refund | Create | `POST /refund/{chargeId}` | `payments: write` |
| Refund | Get Many | `GET /refund/charge/{chargeId}` | `payments: read` |
| Client | Create | `POST /client` | `catalog: write` |
| Client | Update | `PUT /client` | `catalog: write` |
| Client | Get | `GET /client/id/{id}` | `catalog: read` |
| Client | Get Many | `GET /client` | `catalog: read` |

The trigger additionally uses `POST /webhook`, `GET /webhook/{id}` and `DELETE /webhook/{id}`
(`webhooks: read` / `webhooks: write`) when it registers itself.

Charge creation and duplication accept an **Idempotency Key**, sent as the `Idempotency-Key`
header; the API replays the first response for 24h when the same key is reused.

**Simplify** (on by default) unwraps `{ status, message, data }` responses so downstream nodes
receive the payload directly.

## Trigger

**Register Webhook Automatically** (default): activating the workflow creates the webhook in
Rivoo through `POST /webhook` and deactivating deletes it through `DELETE /webhook/{id}`. The
signing secret returned on creation is kept in the workflow's static data, so no webhook
credential is needed. Requires an API key with `webhooks: write` and an n8n instance reachable
on a public URL — Rivoo rejects private/loopback webhook URLs.

Manual mode (toggle off), for local or tunnel-less setups:

1. Activate the workflow and copy the node's **production** webhook URL.
2. Create the webhook in the Rivoo dashboard (or `POST /webhook`) pointing at that URL,
   subscribing to the events you need.
3. Store the returned `secret` in the **Rivoo Webhook Signing Secret** credential.

Each delivery carries `X-Webhook-Event`, `X-Webhook-Delivery`, `X-Webhook-Timestamp` and
`X-Webhook-Signature: sha256=<hmac>`. With **Verify Signature** on, the node recomputes the
HMAC-SHA256 over the raw request body and answers `401` when it does not match.

Output item:

```json
{
  "event": "charge.paid",
  "deliveryId": "…",
  "timestamp": "2026-09-04T12:00:00.000Z",
  "body": { "…": "the Rivoo payload" }
}
```

## Development

```bash
npm install
npm run lint
npm test
npm run build
npm link
cd ~/.n8n/custom && npm link n8n-nodes-rivoo
n8n start
```

### Publishing

Releases run `.github/workflows/publish.yml` through npm **trusted publishing**: the workflow
mints a short-lived OIDC token, so there is no `NPM_TOKEN` secret, and npm attaches the
provenance attestation n8n requires for verified community nodes.

One-time setup on npmjs.com, under the package's *Trusted Publisher* settings:

| Field | Value |
| --- | --- |
| Organization or user | `payera-br` |
| Repository | `n8n-nodes-rivoo` |
| Workflow filename | `publish.yml` |

Then publish by creating a GitHub release (or running the workflow manually). The package and
the repository both have to stay public for provenance to be accepted.

## License

MIT
