import { createHmac } from "node:crypto";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type Subscription = {
  userId: string;
  plan: string;
  status: string;
  airwallexCustomerId: string | null;
  airwallexPaymentIntentId: string | null;
  airwallexPaymentConsentId: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  lastPaymentError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const state = vi.hoisted(() => ({
  subscriptions: new Map<string, Subscription>(),
  webhookEvents: new Map<string, Record<string, unknown>>(),
  createdIntentIds: [] as string[],
  providerIntents: new Map<string, Record<string, unknown>>(),
}));

const airwallex = vi.hoisted(() => ({
  createCustomer: vi.fn(async () => ({ id: "cus_demo" })),
  createProPaymentIntent: vi.fn(async () => {
    const id = `int_${state.createdIntentIds.length + 1}`;
    state.createdIntentIds.push(id);
    return { id, client_secret: `secret_${id}` };
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

  const db = {
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
            airwallexPaymentConsentId: null,
            cancelAtPeriodEnd: false,
            currentPeriodEnd: null,
            lastPaymentError: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...existing,
            ...values,
          } as Subscription);
        };
        return {
          onConflictDoUpdate: async ({ set }: { set: Partial<Subscription> }) => {
            write();
            const row = state.subscriptions.get(values.userId as string)!;
            state.subscriptions.set(row.userId, { ...row, ...set });
          },
          onConflictDoNothing: async () => {
            if (!state.webhookEvents.has(values.id as string)) write();
          },
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
  return { db };
});

let app: Awaited<typeof import("../app")>["default"];

beforeAll(async () => {
  process.env.SESSION_SECRET = "billing-test-session-secret";
  process.env.AIRWALLEX_WEBHOOK_SECRET = "billing-test-webhook-secret";
  process.env.AIRWALLEX_ENV = "demo";
  app = (await import("../app")).default;
});

beforeEach(() => {
  state.subscriptions.clear();
  state.webhookEvents.clear();
  state.createdIntentIds.length = 0;
  state.providerIntents.clear();
  vi.clearAllMocks();
});

async function startCheckout(agent: ReturnType<typeof request.agent>) {
  return agent.post("/api/billing/checkout").send({ plan: "pro" });
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

describe("billing regression flow", () => {
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
      payment_consent_id: "consent_1",
    });
    const sync = await agent.post("/api/billing/checkout/int_1/sync");
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

  it("reset returns to Starter and permits a fresh checkout", async () => {
    const agent = request.agent(app);
    await startCheckout(agent);

    const reset = await agent.post("/api/billing/reset-demo");
    expect(reset.body).toMatchObject({ plan: "starter", status: "inactive" });
    expect([...state.subscriptions.values()][0].airwallexPaymentIntentId).toBeNull();

    const nextCheckout = await startCheckout(agent);
    expect(nextCheckout.status).toBe(200);
    expect(nextCheckout.body.intentId).toBe("int_2");
  });

  it("replays a successful webhook safely", async () => {
    const agent = request.agent(app);
    await startCheckout(agent);
    const event = {
      id: "evt_success",
      name: "payment_intent.succeeded",
      data: { object: { id: "int_1", payment_consent_id: "consent_1" } },
    };

    expect((await signedWebhook(event)).status).toBe(200);
    const firstPeriodEnd = [...state.subscriptions.values()][0].currentPeriodEnd;
    expect((await signedWebhook(event)).status).toBe(200);

    expect(state.webhookEvents.size).toBe(1);
    expect([...state.subscriptions.values()][0]).toMatchObject({
      plan: "pro",
      status: "active",
      currentPeriodEnd: firstPeriodEnd,
    });
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