import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cadenceBillingTable = pgTable("cadence_billing", {
  userKey: text("user_key").primaryKey(),
  plan: text("plan").notNull().default("starter"),
  status: text("status").notNull().default("inactive"),
  airwallexCustomerId: text("airwallex_customer_id"),
  airwallexSubscriptionId: text("airwallex_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertCadenceBillingSchema = createInsertSchema(
  cadenceBillingTable,
);
export type InsertCadenceBilling = z.infer<typeof insertCadenceBillingSchema>;
export type CadenceBilling = typeof cadenceBillingTable.$inferSelect;