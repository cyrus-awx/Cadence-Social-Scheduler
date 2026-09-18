# Cadence

Cadence is a responsive social media scheduling workspace template for small businesses. It combines a polished React dashboard and calendar with a working Airwallex Drop-in checkout, server-verified billing state, signed webhooks, PostgreSQL persistence, and regression tests.

The included Northstar Roasters workspace is sample content intended to show the product experience. Replace the brand, posts, accounts, pricing, and plan copy before using Cadence for another product.

## What is included

- Responsive dashboard with scheduling, publishing, engagement, and account summaries
- Desktop month calendar and mobile/tablet agenda
- Seeded Instagram, LinkedIn, and X post previews
- Starter, Pro, and Business pricing presentation
- Airwallex Drop-in checkout for the $29 Pro demo
- Server-side PaymentIntent verification before Pro activation
- Signed, time-limited Airwallex webhook verification
- Duplicate-checkout and provider-idempotency safeguards
- PostgreSQL subscription and webhook-event persistence
- Demo billing reset and checkout recovery
- Mobile navigation across every route
- OpenAPI source with generated React and Zod clients
- Billing regression tests, including PostgreSQL concurrency coverage
- Security headers, no-store API responses, and secret-file ignore rules

## Product routes

| Route | Purpose |
| --- | --- |
| `/dashboard` | Workspace overview and post schedule |
| `/calendar` | Desktop monthly calendar and mobile agenda |
| `/pricing` | Starter, Pro, and Business comparison |
| `/billing` | Plan state and Airwallex checkout |
| `/api/healthz` | API health check |
| `/api/billing/*` | Billing status, checkout, sync, cancel, reset, and webhook handling |

## What is real and what is demo

### Implemented backend behavior

- Airwallex customer and PaymentIntent creation
- Airwallex-hosted payment collection
- Server-side payment-status retrieval
- Subscription state persisted in PostgreSQL
- Signed webhook validation and replay protection
- Per-user and per-attempt checkout idempotency

### Demo-only behavior

- Social posts and connected accounts are seeded local data.
- There is no social-network OAuth, publishing worker, composer, or post CRUD.
- The user is represented by a signed anonymous cookie, not an account system.
- “Cancel at period end” updates local state; this template does not run recurring collection or provider-side cancellation.
- The Business plan is presentation-only.
- `AIRWALLEX_ENV` defaults to sandbox/demo.

Do not enable production payments until authentication, recurring billing, cancellation, refunds, reconciliation, and your own terms/privacy requirements are implemented.

## Stack

- React 19, Vite, TypeScript, Tailwind CSS
- TanStack Query and Wouter
- Express 5
- PostgreSQL and Drizzle ORM
- OpenAPI, Orval, and Zod
- Vitest and Supertest
- Airwallex Components SDK
- pnpm workspace

## Quick start on Replit

1. Remix this public project.
2. Add a Replit PostgreSQL database.
3. Add the required values in **Replit Secrets**. Do not paste credentials into source files.
4. Run `pnpm install`.
5. Push the development schema with `pnpm --filter @workspace/db run push`.
6. Start the configured Cadence web and API workflows.

Replit artifact routing serves the website at `/` and proxies `/api` to the API artifact. Running only the Vite package outside that routing setup will not proxy API requests.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Signs anonymous user and checkout cookies |
| `AIRWALLEX_CLIENT_ID` | For billing | Airwallex API client ID |
| `AIRWALLEX_API_KEY` | For billing | Airwallex API key |
| `AIRWALLEX_WEBHOOK_SECRET` | For webhooks | Validates Airwallex webhook signatures |
| `AIRWALLEX_ENV` | No | `demo` by default; exact value `prod` uses production |
| `PORT` | Supplied by Replit | Artifact service port |
| `BASE_PATH` | Supplied by Replit | Vite artifact base path |

Secrets are intentionally not included when others remix the project. Each user must configure their own database and provider credentials.

## Airwallex setup

1. Create or use an Airwallex sandbox account.
2. Add the three Airwallex credentials to Replit Secrets.
3. Register the published webhook URL:
   `https://YOUR-PUBLISHED-DOMAIN/api/billing/webhook`
4. Enable the payment methods and wallet domains required by your account.
5. Keep `AIRWALLEX_ENV=demo` while customizing and testing.

Airwallex decides which eligible payment methods appear in the native Drop-in. Apple Pay requires a supported Apple environment, HTTPS, an enabled method, and a registered domain.

## Development commands

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/cadence run dev
pnpm run typecheck
pnpm run build
pnpm run test:billing
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/db run push
pnpm run cleanup:billing-test-schemas
```

The configured Replit workflows should be preferred for normal development because they supply artifact ports and path routing.

## Customization checklist

- Update seeded posts, accounts, and plan features in `artifacts/cadence/src/lib/cadence-data.ts`.
- Replace Northstar Roasters and Maya Chen copy in the shell and Dashboard.
- Update colors and typography in `artifacts/cadence/src/index.css`.
- Update title, description, favicon, and social metadata in `artifacts/cadence/index.html`.
- Change plan price in both the server-owned PaymentIntent code and displayed UI.
- Update the Airwallex metadata and Apple Pay recurring line-item labels.
- Replace anonymous cookie identity with authentication before storing real customer data.
- Add real post persistence and social-provider integrations if turning the demo into a scheduler.

See [TEMPLATE_SPEC.md](TEMPLATE_SPEC.md) for the full product and technical specification.

## Validation

Before publishing a customized remix:

```bash
pnpm run typecheck
pnpm run build
pnpm run test:billing
```

Also verify Dashboard, Calendar, Pricing, and Billing at phone, tablet, and desktop widths, then complete one sandbox payment and reset cycle.

## Sharing as a Replit template

Replit uses public, remix-enabled projects as templates rather than a separate template publishing format:

1. Publish the latest build.
2. Set the project visibility to Public.
3. Allow remixing/forking in project privacy settings.
4. Keep all credentials in Replit Secrets.
5. Include this README and license.

## License

MIT — see [LICENSE](LICENSE).