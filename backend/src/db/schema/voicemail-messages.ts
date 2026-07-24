import { pgTable, uuid, varchar, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const voicemailMessages = pgTable("voicemail_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  callerNumber: varchar("caller_number", { length: 20 }).notNull(),
  callerName: varchar("caller_name", { length: 255 }),
  durationSeconds: integer("duration_seconds").notNull(),
  audioUrl: text("audio_url").notNull(),
  transcription: text("transcription"),
  isRead: boolean("is_read").notNull().default(false),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});
