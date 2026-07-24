import { pgTable, uuid, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { conversations } from "./conversations.js";

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  direction: varchar("direction", { length: 10 }).notNull(),
  body: text("body").notNull(),
  mediaUrls: jsonb("media_urls").default([]),
  status: varchar("status", { length: 20 }).notNull().default("sent"),
  twilioSid: varchar("twilio_sid", { length: 255 }),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});
