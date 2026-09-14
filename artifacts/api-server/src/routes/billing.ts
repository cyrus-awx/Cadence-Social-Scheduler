import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  billingSubscriptionsTable,
  billingWebhookEventsTable,
} from "@workspace/db/schema";
import {
  createCustomer,
  createProPaymentIntent,
  isAirwallexConfigured,
  retrievePaymentIntent,
} from "../lib/airwallex";

const router = Router();
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function getUserId(req: Request, res: Response) {
  const existing = req.signedCookies?.cadence_user as string | undefined;
  if (existing) return existing;
  const id = randomUUID();
  res.cookie("cadence_user", id, {
    signed: true,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
  return id;
}

function serialize(row?: typeof billingSubscriptionsTable.$inferSelect) {
  return {
    plan: row?.plan === "pro" ? "pro" : "starter",
    status: row?.status ?? "inactive",
    cancelAtPeriodEnd: row?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: row?.currentPeriodEnd?.toISOString() ?? null,
    billingConfigured: isAirwallexConfigured(),
  };
}

router.get("/billing/status", async (req, res) => {
  const userId = getUserId(req, res);
  const [subscription] = await db
    .select()
    .from(billingSubscriptionsTable)
    .where(eq(billingSubscriptionsTable.userId, userId))
    .limit(1);
  res.json(serialize(subscription));
});

router.post("/billing/checkout", async (req, res) => {
  if (req.body?.plan !== "pro") {
    res.status(400).json({ message: "Only the Pro plan is available." });
    return;
  }
  if (!isAirwallexConfigured()) {
    res.status(503).json({ message: "Airwallex billing is not configured yet." });
    return;
  }

  const userId = getUserId(req, res);
  const [existing] = await db
    .select()
    .from(billingSubscriptionsTable)
    .where(eq(billingSubscriptionsTable.userId, userId))
    .limit(1);

  let customerId = existing?.airwallexCustomerId;
  if (!customerId) {
    const customer = await createCustomer(userId);
    if (typeof customer.id !== "string") throw new Error("Airwallex customer response has no id");
    customerId = customer.id;
  }

  const origin = `${req.protocol}://${req.get("host")}`;
  const intent = await createProPaymentIntent({
    userId,
    customerId,
    returnUrl: `${origin}/billing`,
  });
  if (typeof intent.id !== "string" || typeof intent.client_secret !== "string") {
    throw new Error("Airwallex PaymentIntent response is incomplete");
  }

  await db
    .insert(billingSubscriptionsTable)
    .values({
      userId,
      status: "pending",
      airwallexCustomerId: customerId,
      airwallexPaymentIntentId: intent.id,
    })
    .onConflictDoUpdate({
      target: billingSubscriptionsTable.userId,
      set: {
        status: "pending",
        airwallexCustomerId: customerId,
        airwallexPaymentIntentId: intent.id,
        updatedAt: new Date(),
      },
    });

  res.json({
    intentId: intent.id,
    clientSecret: intent.client_secret,
    customerId,
    currency: "USD",
    amount: 29,
    environment: process.env.AIRWALLEX_ENV === "prod" ? "prod" : "demo",
  });
});

router.post("/billing/cancel", async (req, res) => {
  const userId = getUserId(req, res);
  const [row] = await db
    .update(billingSubscriptionsTable)
    .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
    .where(and(
      eq(billingSubscriptionsTable.userId, userId),
      eq(billingSubscriptionsTable.status, "active"),
    ))
    .returning();
  res.json(serialize(row));
});

router.post("/billing/reset-demo", async (req, res) => {
  if (process.env.AIRWALLEX_ENV === "prod") {
    res.status(403).json({ message: "Demo billing reset is unavailable in production." });
    return;
  }
  const userId = getUserId(req, res);
  await db
    .delete(billingSubscriptionsTable)
    .where(eq(billingSubscriptionsTable.userId, userId));
  res.json(serialize());
});

router.post("/billing/checkout/:intentId/sync", async (req, res) => {
  const userId = getUserId(req, res);
  const [subscription] = await db
    .select()
    .from(billingSubscriptionsTable)
    .where(and(
      eq(billingSubscriptionsTable.userId, userId),
      eq(billingSubscriptionsTable.airwallexPaymentIntentId, req.params.intentId),
    ))
    .limit(1);
  if (!subscription) {
    res.status(404).json({ message: "Checkout session not found." });
    return;
  }

  const intent = await retrievePaymentIntent(req.params.intentId);
  const providerStatus = typeof intent.status === "string" ? intent.status : "";
  const consentId = typeof intent.payment_consent_id === "string"
    ? intent.payment_consent_id
    : undefined;
  let nextStatus = subscription.status;
  let plan = subscription.plan;
  let currentPeriodEnd = subscription.currentPeriodEnd;
  let lastPaymentError = subscription.lastPaymentError;

  if (providerStatus === "SUCCEEDED") {
    nextStatus = "active";
    plan = "pro";
    currentPeriodEnd = new Date(Date.now() + MONTH_MS);
    lastPaymentError = null;
  } else if (["CANCELLED", "FAILED"].includes(providerStatus)) {
    nextStatus = providerStatus === "CANCELLED" ? "canceled" : "past_due";
    lastPaymentError = providerStatus;
  }

  const [updated] = await db
    .update(billingSubscriptionsTable)
    .set({
      plan,
      status: nextStatus,
      currentPeriodEnd,
      airwallexPaymentConsentId: consentId ?? subscription.airwallexPaymentConsentId,
      lastPaymentError,
      updatedAt: new Date(),
    })
    .where(eq(billingSubscriptionsTable.userId, userId))
    .returning();
  res.json(serialize(updated));
});

type AirwallexEvent = {
  id?: string;
  name?: string;
  data?: { object?: Record<string, unknown> };
};

export async function airwallexWebhook(req: Request, res: Response) {
  const secret = process.env.AIRWALLEX_WEBHOOK_SECRET;
  const timestamp = req.header("x-timestamp");
  const signature = req.header("x-signature");
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
  if (!secret || !timestamp || !signature) {
    res.status(400).send("Missing webhook signature");
    return;
  }
  const expected = createHmac("sha256", secret)
    .update(timestamp)
    .update(rawBody)
    .digest("hex");
  const valid = signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  const timestampNumber = Number(timestamp);
  const timestampMs = timestampNumber > 1_000_000_000_000
    ? timestampNumber
    : timestampNumber * 1000;
  if (!valid || !Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    res.status(400).send("Invalid webhook signature");
    return;
  }

  const event = JSON.parse(rawBody.toString("utf8")) as AirwallexEvent;
  if (!event.id || !event.name) {
    res.status(200).send("ok");
    return;
  }
  const inserted = await db
    .insert(billingWebhookEventsTable)
    .values({ id: event.id, eventName: event.name, payload: event })
    .onConflictDoNothing()
    .returning({ id: billingWebhookEventsTable.id });
  if (inserted.length === 0) {
    res.status(200).send("ok");
    return;
  }

  const object = event.data?.object ?? {};
  const intentId = typeof object.id === "string" ? object.id : undefined;
  if (intentId && event.name === "payment_intent.succeeded") {
    const consentId = typeof object.payment_consent_id === "string"
      ? object.payment_consent_id
      : undefined;
    await db
      .update(billingSubscriptionsTable)
      .set({
        plan: "pro",
        status: "active",
        airwallexPaymentConsentId: consentId,
        currentPeriodEnd: new Date(Date.now() + MONTH_MS),
        cancelAtPeriodEnd: false,
        lastPaymentError: null,
        updatedAt: new Date(),
      })
      .where(eq(billingSubscriptionsTable.airwallexPaymentIntentId, intentId));
  }
  if (intentId && ["payment_intent.payment_failed", "payment_intent.cancelled"].includes(event.name)) {
    await db
      .update(billingSubscriptionsTable)
      .set({
        status: event.name === "payment_intent.payment_failed" ? "past_due" : "canceled",
        lastPaymentError: event.name,
        updatedAt: new Date(),
      })
      .where(eq(billingSubscriptionsTable.airwallexPaymentIntentId, intentId));
  }
  res.status(200).send("ok");
}

export default router;