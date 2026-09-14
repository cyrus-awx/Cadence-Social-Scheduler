import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const billingSubscriptionsTable = pgTable("billing_subscriptions", {
  userId: text("user_id").primaryKey(),
  plan: text("plan").notNull().default("starter"),
  status: text("status").notNull().default("inactive"),
  airwallexCustomerId: text("airwallex_customer_id"),
  airwallexPaymentIntentId: text("airwallex_payment_intent_id"),
  airwallexPaymentConsentId: text("airwallex_payment_consent_id"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  lastPaymentError: text("last_payment_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const billingWebhookEventsTable = pgTable("billing_webhook_events", {
  id: text("id").primaryKey(),
  eventName: text("event_name").notNull(),
  payload: jsonb("payload").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});
