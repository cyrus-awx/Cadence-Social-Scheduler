import { createHmac } from "node:crypto";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type Subscription = {
  userId: string;
  plan: string;
  status: string;
  airwallexCustomerId: string | null;
  airwallexPaymentIntentId: string | null;
  lastPaymentError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const state = vi.hoisted(() => ({
  subscriptions: new Map<string, Subscription>(),
  webhookEvents: new Map<string, Record<string, unknown>>(),
  createdIntentIds: [] as string[],
  providerIntents: new Map<string, Record<string, unknown>>(),
  transactionTail: Promise.resolve(),
  failNextSubscriptionSave: false,
  webhookSubscriptionUpdates: 0,
}));

const airwallex = vi.hoisted(() => ({
  createCustomer: vi.fn(async () => ({ id: "cus_demo" })),
  createProPaymentIntent: vi.fn(async (input: { idempotencyKey: string }) => {
    const existing = state.providerIntents.get(input.idempotencyKey);
    if (existing) return existing;
    const id = `int_${state.createdIntentIds.length + 1}`;
    state.createdIntentIds.push(id);
    const intent = { id, client_secret: `secret_${id}` };
    state.providerIntents.set(input.idempotencyKey, intent);
    return intent;
  }),
  isAirwallexConfigured: vi.fn(() => true),
  retrievePaymentIntent: vi.fn(async (id: string) => state.providerIntents.get(id) ?? { status: "PENDING" }),
}));

vi.mock("../lib/airwallex", () => airwallex);

vi.mock("@workspace/db", async () => {
  const schema = await import("@workspace/db/schema");

  function firstSubscription() {
    return [...state.subscriptions.values()][0];
  }

  const dbBase = {
    execute: async () => undefined,
    select: (selection?: Record<string, unknown>) => ({
      from: (table: unknown) => ({
        where: () => ({
          limit: async () => {
            if (table === schema.billingWebhookEventsTable) {
              const first = [...state.webhookEvents.keys()][0];
              return first ? [{ id: first }] : [];
            }
            const row = firstSubscription();
            if (!row) return [];
            return selection ? [{ id: row.userId }] : [row];
          },
        }),
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => {
        const write = () => {
          if (table === schema.billingWebhookEventsTable) {
            state.webhookEvents.set(values.id as string, values);
            return;
          }
          const existing = state.subscriptions.get(values.userId as string);
          state.subscriptions.set(values.userId as string, {
            userId: values.userId as string,
            plan: "starter",
            status: "inactive",
            airwallexCustomerId: null,
            airwallexPaymentIntentId: null,
            lastPaymentError: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...existing,
            ...values,
          } as Subscription);
        };
        return {
          onConflictDoUpdate: async ({ set }: { set: Partial<Subscription> }) => {
            if (state.failNextSubscriptionSave) {
              state.failNextSubscriptionSave = false;
              throw new Error("simulated subscription save failure");
            }
            write();
            const row = state.subscriptions.get(values.userId as string)!;
            state.subscriptions.set(row.userId, { ...row, ...set });
          },
          onConflictDoNothing: () => ({
            returning: async () => {
              if (state.webhookEvents.has(values.id as string)) return [];
              write();
              return [{ id: values.id as string }];
            },
          }),
        };
      },
    }),
    update: (table: unknown) => ({
      set: (set: Partial<Subscription>) => ({
        where: () => {
          const apply = () => {
            if (table !== schema.billingSubscriptionsTable) return undefined;
            const row = firstSubscription();
            if (!row) return undefined;
            if ("plan" in set && set.plan === "pro") state.webhookSubscriptionUpdates += 1;
            const updated = { ...row, ...set };
            state.subscriptions.set(row.userId, updated);
            return updated;
          };
          const updated = apply();
          return {
            returning: async () => updated ? [updated] : [],
            then: (resolve: (value: unknown) => unknown) => Promise.resolve(undefined).then(resolve),
          };
        },
      }),
    }),
  };
  const db = {
    ...dbBase,
    transaction: async <T>(callback: (tx: typeof dbBase) => Promise<T>) => {
      const previous = state.transactionTail;
      let release!: () => void;
      state.transactionTail = new Promise<void>((resolve) => {
        release = resolve;
      });
      await previous;
      try {
        return await callback(dbBase);
      } finally {
        release();
      }
    },
  };
  return { db };
});

let app: Awaited<typeof import("../app")>["default"];

beforeAll(async () => {
  process.env.SESSION_SECRET = "billing-test-session-secret";
  process.env.AIRWALLEX_WEBHOOK_SECRET = "billing-test-webhook-secret";
  app = (await import("../app")).default;
});

beforeEach(() => {
  state.subscriptions.clear();
  state.webhookEvents.clear();
  state.createdIntentIds.length = 0;
  state.providerIntents.clear();
  state.transactionTail = Promise.resolve();
  state.failNextSubscriptionSave = false;
  state.webhookSubscriptionUpdates = 0;
  vi.clearAllMocks();
});

function sameOriginPost(agent: ReturnType<typeof request.agent>, path: string) {
  return agent.post(path).set("sec-fetch-site", "same-origin");
}

async function startCheckout(agent: ReturnType<typeof request.agent>) {
  return sameOriginPost(agent, "/api/billing/checkout").send({ plan: "pro" });
}

function signedWebhook(event: Record<string, unknown>) {
  const body = JSON.stringify(event);
  const timestamp = String(Date.now());
  const signature = createHmac("sha256", process.env.AIRWALLEX_WEBHOOK_SECRET!)
    .update(timestamp)
    .update(body)
    .digest("hex");
  return request(app)
    .post("/api/billing/webhook")
    .set("content-type", "application/json")
    .set("x-timestamp", timestamp)
    .set("x-signature", signature)
    .send(body);
}

const successfulWebhookEvent = {
  id: "evt_success",
  name: "payment_intent.succeeded",
  data: { object: { id: "int_1" } },
};

function expectPendingStarterSubscription() {
  expect([...state.subscriptions.values()][0]).toMatchObject({
    plan: "starter",
    status: "pending",
    airwallexPaymentIntentId: "int_1",
  });
  expect(state.webhookEvents.size).toBe(0);
}

describe("billing regression flow", () => {
  it("rejects cookie-authenticated POSTs from another origin while allowing webhooks", async () => {
    const response = await request(app)
      .post("/api/billing/reset-demo")
      .set("origin", "https://attacker.example");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Requests must come from this site." });

    const webhook = await signedWebhook({
      id: "evt_cross_origin",
      name: "payment_intent.payment_failed",
      data: { object: { id: "missing" } },
    });
    expect(webhook.status).toBe(200);
    expect(webhook.text).toBe("ok");
  });

  it("rejects cookie-authenticated POSTs when origin evidence is missing", async () => {
    const response = await request(app).post("/api/billing/reset-demo");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Requests must come from this site." });
  });

  it("accepts same-origin cookie-authenticated POSTs", async () => {
    const agent = request.agent(app);
    const response = await agent
      .post("/api/billing/reset-demo")
      .set("sec-fetch-site", "same-origin");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ plan: "starter", status: "inactive" });
  });

  it("rejects same-site requests that are not same-origin", async () => {
    const response = await request(app)
      .post("/api/billing/reset-demo")
      .set("sec-fetch-site", "same-site");

    expect(response.status).toBe(403);
  });

  it("creates one-time Pro checkout metadata and exposes no recurring fields", async () => {
    const agent = request.agent(app);
    const checkout = await startCheckout(agent);

    expect(checkout.status).toBe(200);
    expect(checkout.body).toEqual({
      intentId: "int_1",
      clientSecret: "secret_int_1",
      customerId: "cus_demo",
      currency: "USD",
      amount: 29,
      environment: "demo",
    });
    expect(airwallex.createProPaymentIntent).toHaveBeenCalledWith({
      userId: expect.any(String),
      customerId: "cus_demo",
      idempotencyKey: expect.any(String),
    });
    const stored = state.subscriptions.values().next().value;
    expect(stored).not.toHaveProperty("cancelAtPeriodEnd");
    expect(stored).not.toHaveProperty("currentPeriodEnd");
    expect(stored).not.toHaveProperty("airwallexPaymentConsentId");
    expect(stored).not.toHaveProperty("recurring");
  });

  it("sync activates Pro only for a verified $29 USD Cadence success", async () => {
    const agent = request.agent(app);
    await startCheckout(agent);
    const userId = [...state.subscriptions.keys()][0];

    state.providerIntents.set("int_1", {
      status: "SUCCEEDED",
      amount: 29,
      currency: "USD",
      metadata: { cadence_plan: "pro", cadence_user_id: userId },
    });
    const sync = await sameOriginPost(agent, "/api/billing/checkout/int_1/sync");
    expect(sync.body).toEqual({
      plan: "pro",
      status: "active",
      billingConfigured: true,
    });

    for (const tampered of [
      { amount: 2900 },
      { currency: "EUR" },
      { metadata: { cadence_plan: "pro", cadence_user_id: "someone-else" } },
    ]) {
      await sameOriginPost(agent, "/api/billing/reset-demo");
      const checkout = await startCheckout(agent);
      const intentId = checkout.body.intentId as string;
      state.providerIntents.set(intentId, {
        status: "SUCCEEDED",
        amount: 29,
        currency: "USD",
        metadata: { cadence_plan: "pro", cadence_user_id: userId },
        ...tampered,
      });
      const rejected = await sameOriginPost(agent, `/api/billing/checkout/${intentId}/sync`);
      expect(rejected.status).toBe(200);
      expect(rejected.body).toMatchObject({ plan: "starter", status: "pending" });
      expect([...state.subscriptions.values()][0]).not.toHaveProperty("currentPeriodEnd");
    }
  });

  it("does not expose cancellation or a billing period for the one-time sandbox payment", async () => {
    const agent = request.agent(app);
    await startCheckout(agent);
    state.providerIntents.set("int_1", {
      status: "SUCCEEDED",
      amount: 29,
      currency: "USD",
      metadata: {
        cadence_plan: "pro",
        cadence_user_id: [...state.subscriptions.keys()][0],
      },
    });
    await sameOriginPost(agent, "/api/billing/checkout/int_1/sync");

    const cancel = await sameOriginPost(agent, "/api/billing/cancel");

    expect(cancel.status).toBe(404);
    expect((await agent.get("/api/billing/status")).body).toEqual({
      plan: "pro",
      status: "active",
      billingConfigured: true,
    });
  });

  it("propagates Starter through checkout to verified Pro status", async () => {
    const agent = request.agent(app);
    expect((await agent.get("/api/billing/status")).body).toMatchObject({
      plan: "starter",
      status: "inactive",
    });

    const checkout = await startCheckout(agent);
    expect(checkout.status).toBe(200);
    expect(checkout.body.intentId).toBe("int_1");

    state.providerIntents.set("int_1", {
      status: "SUCCEEDED",
      amount: 29,
      currency: "USD",
      metadata: {
        cadence_plan: "pro",
        cadence_user_id: [...state.subscriptions.keys()][0],
      },
    });
    const sync = await sameOriginPost(agent, "/api/billing/checkout/int_1/sync");
    expect(sync.body).toMatchObject({ plan: "pro", status: "active" });
    expect((await agent.get("/api/billing/status")).body).toMatchObject({
      plan: "pro",
      status: "active",
    });
  });

  it("rejects duplicate checkout without replacing the current intent", async () => {
    const agent = request.agent(app);
    await startCheckout(agent);
    const duplicate = await startCheckout(agent);

    expect(duplicate.status).toBe(409);
    expect(airwallex.createProPaymentIntent).toHaveBeenCalledTimes(1);
    expect([...state.subscriptions.values()][0].airwallexPaymentIntentId).toBe("int_1");
  });

  it("serializes overlapping checkout requests before creating a provider intent", async () => {
    const agent = request.agent(app);
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
      state.createdIntentIds.push("int_1");
      return { id: "int_1", client_secret: "secret_int_1" };
    });

    const first = startCheckout(agent);
    await intentStarted;
    const second = startCheckout(agent);
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(airwallex.createProPaymentIntent).toHaveBeenCalledTimes(1);
    releaseIntent();
    const [firstResponse, secondResponse] = await Promise.all([first, second]);

    expect([firstResponse.status, secondResponse.status].sort()).toEqual([200, 409]);
    expect(airwallex.createProPaymentIntent).toHaveBeenCalledTimes(1);
    expect([...state.subscriptions.values()][0].airwallexPaymentIntentId).toBe("int_1");
  });

  it("reuses the provider intent when saving fails and checkout is retried", async () => {
    const agent = request.agent(app);
    state.failNextSubscriptionSave = true;

    const failed = await startCheckout(agent);
    expect(failed.status).toBe(502);
    expect(state.subscriptions.size).toBe(0);
    expect(state.createdIntentIds).toEqual(["int_1"]);

    const retried = await startCheckout(agent);

    expect(retried.status).toBe(200);
    expect(retried.body.intentId).toBe("int_1");
    expect(airwallex.createProPaymentIntent).toHaveBeenCalledTimes(2);
    expect(airwallex.createProPaymentIntent.mock.calls[0][0].idempotencyKey)
      .toBe(airwallex.createProPaymentIntent.mock.calls[1][0].idempotencyKey);
    expect(state.createdIntentIds).toEqual(["int_1"]);
    expect([...state.subscriptions.values()][0].airwallexPaymentIntentId).toBe("int_1");
  });

  it("reset returns to Starter and permits a fresh checkout", async () => {
    const agent = request.agent(app);
    await startCheckout(agent);

    const reset = await sameOriginPost(agent, "/api/billing/reset-demo");
    expect(reset.body).toMatchObject({ plan: "starter", status: "inactive" });
    expect([...state.subscriptions.values()][0].airwallexPaymentIntentId).toBeNull();

    const nextCheckout = await startCheckout(agent);
    expect(nextCheckout.status).toBe(200);
    expect(nextCheckout.body.intentId).toBe("int_2");
  });

  it("accepts a decoded hex webhook signature", async () => {
    const agent = request.agent(app);
    await startCheckout(agent);
    const body = JSON.stringify(successfulWebhookEvent);
    const timestamp = String(Date.now());
    const rawSignature = createHmac("sha256", process.env.AIRWALLEX_WEBHOOK_SECRET!)
      .update(timestamp)
      .update(body)
      .digest();
    const signature = Buffer.from(String.fromCharCode(...rawSignature), "latin1").toString("hex");

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("content-type", "application/json")
      .set("x-timestamp", timestamp)
      .set("x-signature", signature)
      .send(body);

    expect(response.status).toBe(200);
    expect(state.webhookEvents.has("evt_success")).toBe(true);
  });

  it("claims webhook events atomically before applying state", async () => {
    const agent = request.agent(app);
    await startCheckout(agent);

    const [first, second] = await Promise.all([
      signedWebhook(successfulWebhookEvent),
      signedWebhook(successfulWebhookEvent),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(state.webhookEvents.size).toBe(1);
    expect(state.webhookSubscriptionUpdates).toBe(1);
    expect([...state.subscriptions.values()][0]).toMatchObject({
      plan: "pro",
      status: "active",
    });
  });

  it("replays a successful webhook safely", async () => {
    const agent = request.agent(app);
    await startCheckout(agent);

    expect((await signedWebhook(successfulWebhookEvent)).status).toBe(200);
    expect((await signedWebhook(successfulWebhookEvent)).status).toBe(200);

    expect(state.webhookEvents.size).toBe(1);
    expect(state.webhookSubscriptionUpdates).toBe(1);
    expect([...state.subscriptions.values()][0]).toMatchObject({
      plan: "pro",
      status: "active",
    });
  });

  it("rejects an unsigned webhook without changing access or recording the event", async () => {
    const agent = request.agent(app);
    await startCheckout(agent);

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("content-type", "application/json")
      .send(JSON.stringify(successfulWebhookEvent));

    expect(response.status).toBe(400);
    expect(response.text).toBe("Missing webhook signature");
    expectPendingStarterSubscription();
  });

  it("rejects an invalid webhook signature without changing access or recording the event", async () => {
    const agent = request.agent(app);
    await startCheckout(agent);

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("content-type", "application/json")
      .set("x-timestamp", String(Date.now()))
      .set("x-signature", "tampered")
      .send(JSON.stringify(successfulWebhookEvent));

    expect(response.status).toBe(400);
    expect(response.text).toBe("Invalid webhook signature");
    expectPendingStarterSubscription();
  });

  it("rejects a stale signed webhook without changing access or recording the event", async () => {
    const agent = request.agent(app);
    await startCheckout(agent);
    const body = JSON.stringify(successfulWebhookEvent);
    const timestamp = String(Date.now() - 6 * 60 * 1000);
    const signature = createHmac("sha256", process.env.AIRWALLEX_WEBHOOK_SECRET!)
      .update(timestamp)
      .update(body)
      .digest("hex");

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("content-type", "application/json")
      .set("x-timestamp", timestamp)
      .set("x-signature", signature)
      .send(body);

    expect(response.status).toBe(400);
    expect(response.text).toBe("Invalid webhook signature");
    expectPendingStarterSubscription();
  });

  it("records failed payment processing without granting Pro", async () => {
    const agent = request.agent(app);
    await startCheckout(agent);

    const response = await signedWebhook({
      id: "evt_failed",
      name: "payment_intent.payment_failed",
      data: { object: { id: "int_1" } },
    });

    expect(response.status).toBe(200);
    expect([...state.subscriptions.values()][0]).toMatchObject({
      plan: "starter",
      status: "past_due",
      lastPaymentError: "payment_intent.payment_failed",
    });
    expect(state.webhookEvents.has("evt_failed")).toBe(true);
  });
});