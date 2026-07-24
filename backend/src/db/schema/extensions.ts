import { pgTable, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const extensions = pgTable("extensions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").unique().notNull().references(() => users.id, { onDelete: "cascade" }),
  extension: varchar("extension", { length: 10 }).unique().notNull(),
  callerIdName: varchar("caller_id_name", { length: 255 }).notNull().default(""),
  callerIdNum: varchar("caller_id_num", { length: 20 }).notNull().default(""),
  isRegistered: boolean("is_registered").notNull().default(false),
  sipPassword: varchar("sip_password", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
