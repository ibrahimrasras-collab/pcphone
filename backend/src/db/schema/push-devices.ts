import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const pushDevices = pgTable("push_devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: varchar("platform", { length: 10 }).notNull(),
  token: text("token").notNull(),
  bundleId: varchar("bundle_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
