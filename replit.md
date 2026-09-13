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

- The first build is frontend-only with realistic seeded local data.
- Billing and pricing are informational. Do not add payment processing, checkout, Stripe, or subscription logic unless explicitly requested later.

## Product

- Dashboard summary and social post schedule for Maya Chen's coffee roastery
- Monthly calendar of scheduled and published posts
- Starter, Pro, and Business plan comparison
- Empty billing status linking back to pricing
- Starter scheduling limit state with an intentionally inert upgrade button

## User preferences

- Cadence uses deep indigo `#4F46E5`, warm off-white `#FAFAF9`, Inter, rounded cards, soft shadows, and generous whitespace.

## Gotchas

- The “Upgrade to Pro” button shown after the post limit is reached must remain visually real but perform no action.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
