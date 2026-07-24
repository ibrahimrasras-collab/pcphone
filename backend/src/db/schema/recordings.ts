import { pgTable, uuid, text, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { callRecords } from "./call-records.js";
import { users } from "./users.js";

export const recordings = pgTable("recordings", {
  id: uuid("id").primaryKey().defaultRandom(),
  callRecordId: uuid("call_record_id").notNull().references(() => callRecords.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  audioUrl: text("audio_url").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  fileSizeBytes: integer("file_size_bytes"),
  format: varchar("format", { length: 10 }).notNull().default("wav"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
