import { pgTable, uuid, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const conferences = pgTable("conferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roomName: varchar("room_name", { length: 100 }).notNull(),
  friendlyName: varchar("friendly_name", { length: 255 }),
  pin: varchar("pin", { length: 12 }),
  status: varchar("status", { length: 20 }).notNull().default("created"),
  maxParticipants: integer("max_participants").default(10),
  record: boolean("record").default(false),
  muteOnJoin: boolean("mute_on_join").default(false),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});
