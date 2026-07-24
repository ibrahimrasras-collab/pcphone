import { pgTable, uuid, varchar, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const callRecords = pgTable("call_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  twilioSid: varchar("twilio_sid", { length: 255 }),
  direction: varchar("direction", { length: 10 }).notNull(),
  fromNumber: varchar("from_number", { length: 20 }).notNull(),
  toNumber: varchar("to_number", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  durationSeconds: integer("duration_seconds").default(0),
  cost: decimal("cost", { precision: 10, scale: 6 }).default("0"),
  recorded: boolean("recorded").notNull().default(false),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  hangupCause: varchar("hangup_cause", { length: 50 }),
});
