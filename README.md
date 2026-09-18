# Cadence

Cadence is an open-source React and Express sample for a social scheduling workspace. It presents fictional Northstar Roasters content in a truthful, read-only April 2025 dashboard and demonstrates a one-time $29 USD Airwallex sandbox payment backed by PostgreSQL.

Cadence does not connect social accounts, publish posts, charge subscriptions, renew access, save payment consent, or cancel provider billing. Treat it as a UI and payment-integration starting point, not a production scheduler.

## Included

- Responsive dashboard and month/agenda calendar with deterministic April 2025 sample data
- Starter, Pro, and Business presentation pages
- Official `@airwallex/components-sdk` Drop-in for one-time sandbox payment
- Server-owned $29 USD PaymentIntent creation and verification
- Anonymous signed-cookie demo identity with same-origin POST protection
- Decoded hex webhook HMAC verification, timestamp checks, and atomic event claims
- PostgreSQL persistence and concurrent-checkout protection
- OpenAPI source with generated React Query and Zod clients
- Unit/API tests and optional real-PostgreSQL concurrency coverage
- Replit artifact configuration and GitHub Actions CI

## Routes

| Route | Purpose |
| --- | --- |
| `/dashboard` | Read-only fictional workspace overview |
| `/calendar` | April 2025 sample calendar and adjacent empty months |
| `/pricing` | Sample plan comparison |
| `/billing` | One-time Airwallex sandbox payment demo |
| `/api/healthz` | API health check |
| `/api/billing/status` | Local demo entitlement state |
| `/api/billing/checkout` | Create one $29 USD sandbox PaymentIntent |
| `/api/billing/checkout/:intentId/sync` | Verify amount, currency, status, and Cadence metadata |
| `/api/billing/reset-demo` | Reset local demo entitlement |
| `/api/billing/webhook` | Receive signed Airwallex reconciliation events |

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

1. Remix the public Replit project.
2. Provision Replit PostgreSQL.
3. Add the variables below using Replit Secrets.
4. Run `pnpm install`.
5. Run `pnpm --filter @workspace/db run push`.
6. Start the configured project workflow.

The web artifact is served at `/`; Replit routes `/api` to the API artifact. Running only Vite outside Replit does not proxy API requests.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Signs anonymous demo cookies; use a long random value |
| `AIRWALLEX_CLIENT_ID` | For checkout | Airwallex sandbox API client ID |
| `AIRWALLEX_API_KEY` | For checkout | Airwallex sandbox API key |
| `AIRWALLEX_WEBHOOK_SECRET` | For webhooks | Verifies Airwallex webhook signatures |
| `PORT` | Supplied by Replit | Artifact service port |
| `BASE_PATH` | Supplied by Replit | Vite artifact base path |

This repository intentionally targets Airwallex sandbox. It has no production-environment switch. Never commit populated `.env` files or credentials.

## Airwallex sandbox setup

1. Create an Airwallex sandbox account.
2. Add the three sandbox values using Replit Secrets.
3. Register `https://YOUR-PUBLISHED-DOMAIN/api/billing/webhook` in the sandbox.
4. Enable the sandbox payment methods you need.

The API activates local Pro sample access only after retrieving a `SUCCEEDED` intent with exactly `29` USD and matching `cadence_plan` and anonymous `cadence_user_id` metadata. The Drop-in uses one-time payment mode and disables automatic card saving.

## Development

```bash
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/cadence run dev

pnpm test
pnpm run test:billing       # also requires DATABASE_URL
pnpm run test:coverage
pnpm run test:e2e           # installs/runs Chromium via Playwright
pnpm run typecheck
pnpm run build
pnpm --filter @workspace/api-spec run codegen
```

`pnpm test` runs the deterministic-date and mocked API regression suite. `pnpm run test:coverage` enforces 80% statements, branches, functions, and lines for changed behavior. `pnpm run test:e2e` checks the critical read-only and billing presentation flows in Chromium. `pnpm run test:billing` additionally creates an isolated schema in a real PostgreSQL database to test concurrent checkout serialization.

## Customizing safely

- Replace fictional posts and plan copy in `artifacts/cadence/src/lib/cadence-data.ts`.
- Keep sample-only claims explicit until real OAuth, persistence, and publishing workers exist.
- Change the amount in both `artifacts/api-server/src/lib/airwallex.ts` and the displayed UI, then update tests.
- Replace anonymous cookie identity with authentication and workspace authorization before handling real users.
- Implement your own legal, privacy, refund, reconciliation, abuse-prevention, and observability requirements.
- Add a real recurring billing contract instead of adapting this one-time flow if subscriptions are required.

See [TEMPLATE_SPEC.md](TEMPLATE_SPEC.md), [replit.md](replit.md), and [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE).
