# Cadence

A polished social media scheduling workspace for small businesses.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/cadence run dev` — run the Cadence web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/cadence/src/pages/` — dashboard, calendar, pricing, and billing routes
- `artifacts/cadence/src/components/` — shared Cadence app shell and post UI
- `artifacts/cadence/src/lib/cadence-data.ts` — seeded user, post, account, and plan data
- `artifacts/cadence/src/index.css` — Cadence visual theme

## Architecture decisions

- The dashboard and calendar use realistic seeded local data.
- Pro billing uses an embedded Airwallex Card Element, server-owned pricing, signed webhooks, and PostgreSQL subscription state.

## Product

- Dashboard summary and social post schedule for Maya Chen's coffee roastery
- Monthly calendar of scheduled and published posts
- Starter, Pro, and Business plan comparison
- Airwallex-powered $29/month Pro upgrade and billing status
- Starter scheduling limit state with an intentionally inert upgrade button

## User preferences

- Cadence uses terracotta `#C2410C`, warm off-white `#FAFAF9`, Inter, 10px radii, hairline borders, and generous whitespace.

## Gotchas

- Billing requires `AIRWALLEX_CLIENT_ID`, `AIRWALLEX_API_KEY`, and `AIRWALLEX_WEBHOOK_SECRET`; `AIRWALLEX_ENV` is `demo` unless set to `prod`.
- Airwallex Card Element scheduled consent confirmation should send `next_triggered_by: merchant` and `merchant_trigger_reason: scheduled` without custom terms.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
