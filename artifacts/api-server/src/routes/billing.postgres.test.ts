import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { sql } from "drizzle-orm";

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

beforeAll(async () => {
  process.env.SESSION_SECRET = "billing-postgres-test-session-secret";
  process.env.AIRWALLEX_ENV = "demo";
  ({ db, pool } = await import("@workspace/db"));
  app = (await import("../app")).default;
});

afterEach(async () => {
  await db.execute(sql`
    delete from billing_subscriptions
    where airwallex_customer_id like 'postgres-concurrency-test-%'
  `);
  vi.clearAllMocks();
});

afterAll(async () => {
  await pool.end();
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