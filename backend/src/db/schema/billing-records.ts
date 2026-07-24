import { pgTable, uuid, varchar, text, decimal, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const billingRecords = pgTable("billing_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 20 }).notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 4 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  invoiceId: varchar("invoice_id", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
