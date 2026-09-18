# Cadence on Replit

Cadence is a read-only social scheduling UI sample with a one-time $29 USD Airwallex sandbox checkout. All Northstar Roasters content and metrics are fictional. There are no live social connections or publishing jobs, and the payment is not a subscription.

## Run

1. Provision Replit PostgreSQL.
2. Add `SESSION_SECRET` and the Airwallex sandbox values from `.env.example` in Replit Secrets.
3. Run `pnpm install`.
4. Run `pnpm --filter @workspace/db run push` once for the development schema.
5. Start the **Project** workflow.

Replit artifact routing serves the Cadence web app at `/` and proxies `/api` to the Express artifact.

## Commands

- `pnpm --filter @workspace/api-server run dev` — API artifact
- `pnpm --filter @workspace/cadence run dev` — web artifact
- `pnpm test` — mocked API and deterministic sample-date tests
- `pnpm run test:billing` — includes real PostgreSQL concurrency coverage
- `pnpm run test:coverage` — enforces 80% coverage for changed behavior
- `pnpm run test:e2e` — critical read-only and billing browser flows
- `pnpm run typecheck` — workspace TypeScript checks
- `pnpm run build` — production builds
- `pnpm --filter @workspace/api-spec run codegen` — regenerate clients
- `pnpm --filter @workspace/db run push` — sync development schema

## Structure

- `artifacts/cadence` — React/Vite app
- `artifacts/api-server` — Express and Airwallex sandbox API
- `lib/db` — Drizzle schema and PostgreSQL connection
- `lib/api-spec` — OpenAPI source
- `lib/api-client-react`, `lib/api-zod` — generated clients
- `scripts` — isolated test-schema cleanup

## Guardrails

- Keep all provider credentials in Replit Secrets.
- This repository always calls the Airwallex sandbox API; there is no production switch.
- The Drop-in is one-time `payment` mode and does not request saved consent.
- The server owns and verifies status, $29 amount, USD currency, and Cadence user/plan metadata.
- Cookie-authenticated POSTs must be same-origin; signed provider webhooks are exempt.
- The sample UI must remain truthful until real social OAuth, persistence, and publishing are implemented.
- Read `README.md`, `TEMPLATE_SPEC.md`, and `SECURITY.md` before remixing.
