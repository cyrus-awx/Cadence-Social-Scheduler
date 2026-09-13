import { Router, type IRouter } from "express";
import { db, cadenceBillingTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateBillingCheckoutResponse,
  GetBillingStatusResponse,
  ReceiveAirwallexWebhookResponse,
  ResetBillingDemoResponse,
} from "@workspace/api-zod";
import {
  createProCheckout,
  verifyCompletedProCheckout,
  verifyAirwallexWebhook,
} from "../lib/airwallex";

const router: IRouter = Router();
const cadenceUserKey = "maya-chen";

router.get("/billing/status", async (_req, res): Promise<void> => {
  const [billing] = await db
    .select()
    .from(cadenceBillingTable)
    .where(eq(cadenceBillingTable.userKey, cadenceUserKey));
  res.json(
    GetBillingStatusResponse.parse({
      plan: billing?.plan === "pro" ? "pro" : "starter",
      status: billing?.status ?? "inactive",
      currentPeriodEnd: billing?.currentPeriodEnd?.toISOString() ?? null,
    }),
  );
});

router.post("/billing/checkout", async (req, res): Promise<void> => {
  try {
    const origin =
      req.get("origin") ??
      `${req.protocol}://${req.get("host") ?? process.env.REPLIT_DEV_DOMAIN}`;
    const checkout = await createProCheckout(
      cadenceUserKey,
      new URL("/billing", origin).toString(),
    );
    res.status(201).json(CreateBillingCheckoutResponse.parse(checkout));
  } catch (error) {
    req.log.error({ err: error }, "Failed to create Airwallex checkout");
    res.status(502).json({ error: "Unable to start checkout right now" });
  }
});

router.post(
  "/billing/checkout/:checkoutId/sync",
  async (req, res): Promise<void> => {
    try {
      const completed = await verifyCompletedProCheckout(
        req.params.checkoutId,
        cadenceUserKey,
      );

      if (completed) {
        await db
          .insert(cadenceBillingTable)
          .values({
            userKey: cadenceUserKey,
            plan: "pro",
            status: "active",
            airwallexCustomerId: completed.customerId,
            airwallexSubscriptionId: completed.subscriptionId,
          })
          .onConflictDoUpdate({
            target: cadenceBillingTable.userKey,
            set: {
              plan: "pro",
              status: "active",
              airwallexCustomerId: completed.customerId,
              airwallexSubscriptionId: completed.subscriptionId,
            },
          });
      }

      const [billing] = await db
        .select()
        .from(cadenceBillingTable)
        .where(eq(cadenceBillingTable.userKey, cadenceUserKey));
      res.json(
        GetBillingStatusResponse.parse({
          plan: billing?.plan === "pro" ? "pro" : "starter",
          status: billing?.status ?? "inactive",
          currentPeriodEnd: billing?.currentPeriodEnd?.toISOString() ?? null,
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, "Failed to sync Airwallex checkout");
      res.status(502).json({ error: "Unable to verify checkout right now" });
    }
  },
);

router.post("/billing/demo-reset", async (_req, res): Promise<void> => {
  if ((process.env.AIRWALLEX_ENVIRONMENT ?? "sandbox") !== "sandbox") {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db
    .insert(cadenceBillingTable)
    .values({
      userKey: cadenceUserKey,
      plan: "starter",
      status: "inactive",
      airwallexCustomerId: null,
      airwallexSubscriptionId: null,
      currentPeriodEnd: null,
    })
    .onConflictDoUpdate({
      target: cadenceBillingTable.userKey,
      set: {
        plan: "starter",
        status: "inactive",
        airwallexCustomerId: null,
        airwallexSubscriptionId: null,
        currentPeriodEnd: null,
      },
    });

  res.json(
    ResetBillingDemoResponse.parse({
      plan: "starter",
      status: "inactive",
      currentPeriodEnd: null,
    }),
  );
});

router.post("/airwallex/webhooks", async (req, res): Promise<void> => {
  const timestamp = req.get("x-timestamp");
  const signature = req.get("x-signature");
  const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
  if (
    !timestamp ||
    !signature ||
    !rawBody ||
    !verifyAirwallexWebhook(timestamp, signature, rawBody)
  ) {
    res.status(401).json({ error: "Invalid webhook signature" });
    return;
  }

  const event = req.body as Record<string, unknown>;
  const eventName =
    typeof event.name === "string"
      ? event.name
      : typeof event.type === "string"
        ? event.type
        : "";
  const data = event.data as Record<string, unknown> | undefined;
  const object = (data?.object ?? data) as Record<string, unknown> | undefined;
  const metadata = object?.metadata as Record<string, unknown> | undefined;
  const userKey =
    typeof metadata?.cadence_user_key === "string"
      ? metadata.cadence_user_key
      : cadenceUserKey;

  if (/subscription.*(active|created)|billing_checkout.*completed/i.test(eventName)) {
    await db
      .insert(cadenceBillingTable)
      .values({
        userKey,
        plan: "pro",
        status: "active",
        airwallexCustomerId:
          typeof object?.billing_customer_id === "string"
            ? object.billing_customer_id
            : null,
        airwallexSubscriptionId:
          typeof object?.subscription_id === "string"
            ? object.subscription_id
            : typeof object?.id === "string" && /subscription/i.test(eventName)
              ? object.id
              : null,
      })
      .onConflictDoUpdate({
        target: cadenceBillingTable.userKey,
        set: { plan: "pro", status: "active" },
      });
  } else if (/subscription.*(cancel|expired|failed|past_due)/i.test(eventName)) {
    await db
      .insert(cadenceBillingTable)
      .values({ userKey, plan: "starter", status: "inactive" })
      .onConflictDoUpdate({
        target: cadenceBillingTable.userKey,
        set: { plan: "starter", status: eventName },
      });
  }

  res.json(ReceiveAirwallexWebhookResponse.parse({ received: true }));
});

export default router;