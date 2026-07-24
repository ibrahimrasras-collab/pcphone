import { pgTable, uuid, varchar, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const voicemailSettings = pgTable("voicemail_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").unique().notNull().references(() => users.id, { onDelete: "cascade" }),
  greetingType: varchar("greeting_type", { length: 10 }).notNull().default("default"),
  greetingUrl: text("greeting_url"),
  transcription: boolean("transcription").notNull().default(true),
  emailNotify: boolean("email_notify").notNull().default(false),
  emailAddress: varchar("email_address", { length: 255 }),
  pin: varchar("pin", { length: 6 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
