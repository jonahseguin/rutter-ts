# rutter-ts

TypeScript SDK for the [Rutter API](https://docs.rutter.com). Includes a lightweight HTTP client, typed API wrappers with Zod response validation, and auto-generated types from the Rutter OpenAPI spec.

## Install

```bash
npm install rutter-ts zod
# or
bun add rutter-ts zod
```

`zod` is a peer dependency (`>=3.23.0 || >=4.0.0`).

## Entry Points

The package is split into three entry points to support tree-shaking and bundle-size-sensitive environments (e.g. Convex, Cloudflare Workers):

| Entry | What | Size |
|---|---|---|
| `rutter-ts` | Client, errors, types, constants | ~3KB |
| `rutter-ts/api` | `RutterConnectionsApi`, `RutterAccountingApi` | ~5KB + generated |
| `rutter-ts/generated` | All generated Zod validators + TypeScript types | ~500KB |

If you're in a serverless environment with strict bundle limits, import the lightweight `rutter-ts` entry for queries/mutations and only import `rutter-ts/api` in contexts that allow larger bundles (e.g. Node.js actions).

## Quick Start

```typescript
import { RutterClient, RUTTER_SANDBOX_BASE_URL } from 'rutter-ts'
import { RutterConnectionsApi, RutterAccountingApi } from 'rutter-ts/api'

const client = new RutterClient(
  RUTTER_SANDBOX_BASE_URL,
  process.env.RUTTER_CLIENT_ID,
  process.env.RUTTER_CLIENT_SECRET,
)

const connections = new RutterConnectionsApi(client)
const accounting = new RutterAccountingApi(client)
```

## Connections API

```typescript
// Create a connection
const { connection } = await connections.create({ platform: 'QUICKBOOKS' })
console.log(connection.link_url) // Rutter Link URL for the user

// Exchange a public token for an access token
const { access_token } = await connections.exchangeToken({
  public_token: 'pt_...',
})

// List all connections
const { connections: list } = await connections.list()

// Get connection details by access token
const { connection: details } = await connections.get(access_token)

// Delete a connection
await connections.delete(access_token)
```

## Accounting API

```typescript
// Get company info
const { company_info } = await accounting.getCompanyInfo(accessToken)

// List accounts (with pagination)
const { accounts, next_cursor } = await accounting.listAccounts(accessToken, {
  cursor: 'cur_...',
})

// Get a single account
const { account } = await accounting.getAccount(accessToken, accountId)

// List invoices
const { invoices } = await accounting.listInvoices(accessToken)

// Get a single invoice
const { invoice } = await accounting.getInvoice(accessToken, invoiceId)

// Create an invoice (with idempotency key)
const { invoice: created } = await accounting.createInvoice(
  accessToken,
  {
    customer_id: 'cust_...',
    issue_date: '2024-07-01',
    currency_code: 'USD',
    line_items: [{ description: 'Consulting', total_amount: 5000 }],
  },
  'idem_unique_key',
)
```

## Error Handling

All API methods throw typed errors:

```typescript
import { RutterError, RutterSchemaMismatchError } from 'rutter-ts'

try {
  await connections.create({ platform: 'QUICKBOOKS' })
} catch (e) {
  if (e instanceof RutterError) {
    console.error(e.status)        // HTTP status code
    console.error(e.errorType)     // e.g. 'AUTHENTICATION_ERROR'
    console.error(e.errorCode)     // e.g. 'invalid_credentials'
    console.error(e.metadata)      // Optional error metadata

    // Helpers
    e.isRateLimited       // true for 429 (Rutter) or 452 (platform)
    e.isUserActionable    // true for 400, 409, 410, 450
    e.humanReadableMessage // metadata.human_readable ?? message
  }

  if (e instanceof RutterSchemaMismatchError) {
    console.error(e.endpoint) // Which endpoint had the schema mismatch
  }
}
```

## Using Generated Types

Import Zod validators and TypeScript types directly:

```typescript
import { zPlatform, zConnectionResponse } from 'rutter-ts/generated'
import type { Invoice, Account, CompanyInfo20240430 } from 'rutter-ts/generated'
```

## Low-Level Client

Use `RutterClient` directly for endpoints not yet wrapped by the API classes:

```typescript
import { RutterClient, RUTTER_PRODUCTION_BASE_URL } from 'rutter-ts'

const client = new RutterClient(
  RUTTER_PRODUCTION_BASE_URL,
  clientId,
  clientSecret,
)

// GET with query params
const data = await client.get('/accounting/bills', {
  access_token: 'at_...',
  cursor: 'cur_...',
})

// POST with body and idempotency key
const result = await client.post(
  '/accounting/invoices?access_token=at_...',
  { customer_id: 'cust_1', line_items: [] },
  { idempotencyKey: 'unique_key' },
)

// PATCH and DELETE
await client.patch('/some/endpoint', { field: 'value' })
await client.delete('/connections', { access_token: 'at_...' })
```

## Constants

```typescript
import {
  RUTTER_SANDBOX_BASE_URL,      // https://sandbox.rutterapi.com/versioned
  RUTTER_PRODUCTION_BASE_URL,   // https://production.rutterapi.com/versioned
  RUTTER_API_VERSION,           // 2024-08-31
} from 'rutter-ts'
```

## Regenerating Types

The generated types are built from the Rutter OpenAPI spec:

```bash
bun run generate
```

This runs `@hey-api/openapi-ts` against `https://docs.rutter.com/rest/2024-08-31/spec` and applies a post-generation fixup script.

## License

MIT
