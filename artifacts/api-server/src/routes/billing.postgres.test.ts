import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { sql } from "drizzle-orm";
import pg from "pg";
import { createApplicationTablesInSchema } from "@workspace/db/testing";

const airwallex = vi.hoisted(() => ({
  createCustomer: vi.fn(async (userId: string) => ({
    id: `postgres-concurrency-test-${userId}`,
  })),
  createProPaymentIntent: vi.fn(),
  isAirwallexConfigured: vi.fn(() => true),
  retrievePaymentIntent: vi.fn(),
}));

vi.mock("../lib/airwallex", () => airwallex);

let app: Awaited<typeof import("../app")>["default"];
let db: typeof import("@workspace/db")["db"];
let pool: typeof import("@workspace/db")["pool"];
let setupPool: pg.Pool;
const testSchema = `billing_test_${randomUUID().replaceAll("-", "")}`;
const testApplicationName = `billing-test:${testSchema}`;

beforeAll(async () => {
  process.env.SESSION_SECRET = "billing-postgres-test-session-secret";
  process.env.AIRWALLEX_ENV = "demo";
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for the PostgreSQL billing regression");
  }

  const setupDatabaseUrl = new URL(process.env.DATABASE_URL);
  setupDatabaseUrl.searchParams.set("application_name", testApplicationName);
  setupPool = new pg.Pool({ connectionString: setupDatabaseUrl.toString() });
  await setupPool.query(`create schema "${testSchema}"`);
  await setupPool.query(`
    create table "${testSchema}".billing_test_schema_owner (
      marker text primary key check (marker = 'cadence-billing-test'),
      owner_id text not null,
      created_at timestamptz not null default now()
    );
    insert into "${testSchema}".billing_test_schema_owner (marker, owner_id)
    values ('cadence-billing-test', '${testSchema}');
    create table "${testSchema}".billing_subscriptions (
      user_id text primary key,
      plan text not null default 'starter',
      status text not null default 'inactive',
      airwallex_customer_id text,
      airwallex_payment_intent_id text,
      airwallex_payment_consent_id text,
      cancel_at_period_end boolean not null default false,
      current_period_end timestamptz,
      last_payment_error text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create table "${testSchema}".billing_webhook_events (
      id text primary key,
      event_name text not null,
      payload jsonb not null,
      processed_at timestamptz not null default now()
    );
  `);

  const isolatedDatabaseUrl = new URL(process.env.DATABASE_URL);
  isolatedDatabaseUrl.searchParams.set("options", `-csearch_path=${testSchema}`);
  isolatedDatabaseUrl.searchParams.set("application_name", testApplicationName);
  process.env.DATABASE_URL = isolatedDatabaseUrl.toString();
  ({ db, pool } = await import("@workspace/db"));
  app = (await import("../app")).default;
});

afterEach(async () => {
  await db.execute(sql`truncate table billing_subscriptions, billing_webhook_events`);
  vi.clearAllMocks();
});

afterAll(async () => {
  if (pool) await pool.end();
  if (setupPool) {
    await setupPool.query(`drop schema if exists "${testSchema}" cascade`);
    await setupPool.end();
  }
});

async function waitForSeparateTransactions(acquiredClients: Set<unknown>) {
  const deadline = Date.now() + 2_000;
  while (acquiredClients.size < 2) {
    if (Date.now() >= deadline) {
      throw new Error("Overlapping checkouts did not acquire separate PostgreSQL connections");
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

describe("billing PostgreSQL concurrency", () => {
  it("creates one provider intent when checkout requests overlap on separate connections", async () => {
    const agent = request.agent(app);
    await agent.get("/api/billing/status");

    let releaseIntent!: () => void;
    const intentBlocked = new Promise<void>((resolve) => {
      releaseIntent = resolve;
    });
    let signalIntentStarted!: () => void;
    const intentStarted = new Promise<void>((resolve) => {
      signalIntentStarted = resolve;
    });
    airwallex.createProPaymentIntent.mockImplementationOnce(async () => {
      signalIntentStarted();
      await intentBlocked;
      return { id: "postgres_test_intent", client_secret: "postgres_test_secret" };
    });

    const acquiredClients = new Set<unknown>();
    const recordClient = (client: unknown) => acquiredClients.add(client);
    pool.on("acquire", recordClient);
    const first = agent.post("/api/billing/checkout").send({ plan: "pro" }).then((response) => response);
    await intentStarted;
    const second = agent.post("/api/billing/checkout").send({ plan: "pro" }).then((response) => response);
    await waitForSeparateTransactions(acquiredClients);
    pool.off("acquire", recordClient);

    expect(airwallex.createProPaymentIntent).toHaveBeenCalledTimes(1);
    releaseIntent();
    const responses = await Promise.all([first, second]);

    expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
    expect(airwallex.createProPaymentIntent).toHaveBeenCalledTimes(1);
  });
});
