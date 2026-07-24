import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const callForwarding = pgTable("call_forwarding", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").unique().notNull().references(() => users.id, { onDelete: "cascade" }),
  alwaysTo: varchar("always_to", { length: 20 }),
  busyTo: varchar("busy_to", { length: 20 }),
  noAnswerTo: varchar("no_answer_to", { length: 20 }),
  noAnswerRings: integer("no_answer_rings").notNull().default(15),
  unavailableTo: varchar("unavailable_to", { length: 20 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
