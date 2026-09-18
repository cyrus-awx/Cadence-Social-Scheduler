import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { and, eq, sql } from "drizzle-orm";
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
const CHECKOUT_ATTEMPT_COOKIE = "cadence_checkout_attempt";

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

function getCheckoutAttemptId(req: Request, res: Response) {
  const existing = req.signedCookies?.[CHECKOUT_ATTEMPT_COOKIE] as string | undefined;
  if (existing) return existing;
  const id = randomUUID();
  res.cookie(CHECKOUT_ATTEMPT_COOKIE, id, {
    signed: true,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
  });
  return id;
}

function clearCheckoutAttempt(res: Response) {
  res.clearCookie(CHECKOUT_ATTEMPT_COOKIE, {
    signed: true,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

function serialize(row?: typeof billingSubscriptionsTable.$inferSelect) {
  return {
    plan: row?.plan === "pro" ? "pro" : "starter",
    status: row?.status ?? "inactive",
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
  const checkoutAttemptId = getCheckoutAttemptId(req, res);
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`);

    const [existing] = await tx
      .select()
      .from(billingSubscriptionsTable)
      .where(eq(billingSubscriptionsTable.userId, userId))
      .limit(1);
    if (existing?.status === "active") {
      return { conflict: "Pro is already active for this workspace." } as const;
    }
    if (existing?.status === "pending" && existing.airwallexPaymentIntentId) {
      return { conflict: "A checkout is already in progress. Reset the demo before starting another." } as const;
    }

    let customerId = existing?.airwallexCustomerId;
    if (!customerId) {
      const customer = await createCustomer(userId);
      if (typeof customer.id !== "string") throw new Error("Airwallex customer response has no id");
      customerId = customer.id;
    }

    const intent = await createProPaymentIntent({
      userId,
      customerId,
      idempotencyKey: checkoutAttemptId,
    });
    if (typeof intent.id !== "string" || typeof intent.client_secret !== "string") {
      throw new Error("Airwallex PaymentIntent response is incomplete");
    }

    await tx
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

    return { intent, customerId } as const;
  });

  if ("conflict" in result) {
    clearCheckoutAttempt(res);
    res.status(409).json({ message: result.conflict });
    return;
  }
  clearCheckoutAttempt(res);
  res.json({
    intentId: result.intent.id,
    clientSecret: result.intent.client_secret,
    customerId: result.customerId,
    currency: "USD",
    amount: 29,
    environment: "demo",
  });
});

router.post("/billing/reset-demo", async (req, res) => {
  const userId = getUserId(req, res);
  clearCheckoutAttempt(res);
  const [reset] = await db
    .update(billingSubscriptionsTable)
    .set({
      plan: "starter",
      status: "inactive",
      airwallexPaymentIntentId: null,
      lastPaymentError: null,
      updatedAt: new Date(),
    })
    .where(eq(billingSubscriptionsTable.userId, userId))
    .returning();
  res.json(serialize(reset));
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
  const metadata = typeof intent.metadata === "object" && intent.metadata !== null
    ? intent.metadata as Record<string, unknown>
    : {};
  const verifiedSuccess = providerStatus === "SUCCEEDED" &&
    intent.amount === 29 &&
    intent.currency === "USD" &&
    metadata.cadence_plan === "pro" &&
    metadata.cadence_user_id === userId;
  let nextStatus = subscription.status;
  let plan = subscription.plan;
  let lastPaymentError = subscription.lastPaymentError;

  if (verifiedSuccess) {
    nextStatus = "active";
    plan = "pro";
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
    .digest();
  const decodedSignature = /^[0-9a-f]{64}$/i.test(signature)
    ? Buffer.from(signature, "hex")
    : Buffer.alloc(0);
  const valid = decodedSignature.length === expected.length &&
    timingSafeEqual(decodedSignature, expected);
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
  const eventId = event.id;
  const eventName = event.name;
  await db.transaction(async (tx) => {
    const [claim] = await tx
      .insert(billingWebhookEventsTable)
      .values({ id: eventId, eventName, payload: event })
      .onConflictDoNothing()
      .returning({ id: billingWebhookEventsTable.id });
    if (!claim) return;

    const object = event.data?.object ?? {};
    const intentId = typeof object.id === "string" ? object.id : undefined;
    if (intentId && eventName === "payment_intent.succeeded") {
      await tx
        .update(billingSubscriptionsTable)
        .set({
          plan: "pro",
          status: "active",
          lastPaymentError: null,
          updatedAt: new Date(),
        })
        .where(eq(billingSubscriptionsTable.airwallexPaymentIntentId, intentId));
    }
    if (intentId && ["payment_intent.payment_failed", "payment_intent.cancelled"].includes(eventName)) {
      await tx
        .update(billingSubscriptionsTable)
        .set({
          status: eventName === "payment_intent.payment_failed" ? "past_due" : "canceled",
          lastPaymentError: eventName,
          updatedAt: new Date(),
        })
        .where(eq(billingSubscriptionsTable.airwallexPaymentIntentId, intentId));
    }
  });
  res.status(200).send("ok");
}

export default router;