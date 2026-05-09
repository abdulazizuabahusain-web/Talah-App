import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { usersTable } from "./users";

export const requestsTable = pgTable(
  "requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    meetupType: text("meetup_type").notNull(), // 'coffee' | 'dinner'
    preferredDate: text("preferred_date").notNull(),
    preferredTime: text("preferred_time").notNull(), // 'morning' | 'afternoon' | 'evening'
    area: text("area").notNull(),
    status: text("status").notNull().default("pending"),
    // 'pending' | 'matched' | 'cancelled'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("requests_user_id_idx").on(table.userId),
    index("requests_status_idx").on(table.status),
    index("requests_created_at_idx").on(table.createdAt),
  ],
);

export const insertRequestSchema = createInsertSchema(requestsTable).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requestsTable.$inferSelect;
