# Cadence Template Specification

## Product boundary

Cadence is an open-source, responsive social-workspace sample. Northstar Roasters, Maya Chen, its profiles, posts, engagement numbers, and April 2025 timeline are fictional local data. The dashboard and calendar are intentionally read-only: no provider is connected and no post is created, edited, queued, or published.

The billing page is an Airwallex sandbox integration reference. It takes one $29 USD test payment and unlocks a local Pro sample entitlement for the anonymous browser. It is not a recurring subscription, has no billing period, does not request saved payment consent, and has nothing to cancel.

## User-facing capabilities

- Desktop sidebar and compact mobile navigation
- Deterministic April 18, 2025 sample date and April calendar
- Read-only scheduled/published post presentation
- Explicitly fictional engagement and profile summaries
- Sample pricing comparison
- Explicit checkout loading, ready, verifying, success, and error states
- Official Airwallex Components SDK Drop-in in one-time payment mode
- Keyboard focus treatments, semantic headings, status/alert announcements, and labelled controls

## Payment sequence

1. The browser requests the Pro sample checkout.
2. The API identifies the browser using a signed, HTTP-only anonymous cookie.
3. A PostgreSQL advisory transaction lock serializes checkout requests for that identity.
4. The API reuses or creates an Airwallex sandbox customer.
5. The API creates exactly one $29 USD PaymentIntent with `cadence_plan` and `cadence_user_id` metadata.
6. The pending intent is stored in PostgreSQL.
7. The browser mounts the official Drop-in with `mode: payment` and automatic card saving disabled.
8. After client success, the API retrieves the PaymentIntent.
9. Local Pro sample access activates only for `SUCCEEDED`, amount `29`, currency `USD`, plan `pro`, and the same anonymous user.
10. A signed webhook can reconcile success or failure. Its event row is claimed first in the same transaction as the entitlement update.

## Architecture

| Package | Responsibility |
| --- | --- |
| `artifacts/cadence` | React/Vite sample interface |
| `artifacts/api-server` | Express API and Airwallex sandbox integration |
| `lib/db` | PostgreSQL client and Drizzle schema |
| `lib/api-spec` | OpenAPI source |
| `lib/api-client-react` | Generated React Query client |
| `lib/api-zod` | Generated Zod schemas |
| `scripts` | Isolated billing-test schema cleanup |

Replit artifact routing mounts the web artifact at `/` and the API at `/api`.

## Persistence

`billing_subscriptions` stores anonymous user ID, local plan/status, Airwallex customer ID, PaymentIntent ID, last error, and timestamps. It deliberately has no payment-consent, cancellation, or period fields.

`billing_webhook_events` stores the provider event ID, event name, original payload, and processed timestamp. Its primary key is the atomic replay claim.

## Security controls

- Server-only credentials and startup validation for database/session configuration
- Signed, HTTP-only, SameSite cookies; Secure in production deployments
- Same-origin validation for cookie-authenticated POST routes using `Origin` and Fetch Metadata
- Webhook route mounted before the cookie POST guard
- Raw webhook body verification with HMAC-SHA256
- Hex signature decoding before constant-time byte comparison
- Five-minute webhook timestamp tolerance
- Atomic webhook claim and state update in one database transaction
- Server-side amount, currency, status, plan metadata, and anonymous-user verification
- Checkout idempotency key and per-user PostgreSQL advisory lock
- API no-store and browser security headers
- Query strings omitted from request logs
- Secret patterns ignored by Git
- Minimum npm package release age

## Validation

- `pnpm test`: deterministic date/calendar tests plus mocked API integration tests
- `pnpm run test:billing`: the above API suite plus a real PostgreSQL concurrency test; requires `DATABASE_URL`
- `pnpm run typecheck`: workspace TypeScript validation
- `pnpm run build`: typecheck and production builds
- `pnpm --filter @workspace/api-spec run codegen`: regenerate API clients after contract changes

## Required production work

Before turning Cadence into a real scheduler or paid product, implement authentication, workspace authorization, social OAuth/token storage, post/media persistence, publishing workers, retries, analytics ingestion, rate limits, legal/privacy/refund policies, reconciliation, monitoring, and customer support.

If recurring billing is required, design a separate provider-backed subscription lifecycle with explicit consent, renewals, cancellation, entitlement expiry, invoices, disputes, and recovery. Do not present this one-time sandbox flow as that lifecycle.

## Acceptance checklist

- [ ] No credentials, populated `.env`, private keys, or database URLs are committed.
- [ ] The PostgreSQL schema initializes.
- [ ] Dashboard and calendar clearly identify fictional read-only sample content.
- [ ] Checkout is disabled when Airwallex sandbox credentials are absent.
- [ ] OpenAPI codegen is current.
- [ ] `pnpm test`, typecheck, and build pass.
- [ ] The real PostgreSQL test passes where `DATABASE_URL` is available.
- [ ] Phone, tablet, desktop, keyboard, and screen-reader basics are checked.
- [ ] One Airwallex sandbox checkout and reset cycle is manually verified.
