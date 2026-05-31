import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { groupsTable } from "./groups";
import { usersTable } from "./users";

export const reportsTable = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    targetUserId: uuid("target_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    groupId: uuid("group_id").references(() => groupsTable.id, {
      onDelete: "set null",
    }),
    reportCategory: text("report_category"),
    reason: text("reason").notNull(),
    details: text("details"),
    status: text("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reports_target_user_idx").on(t.targetUserId),
    index("reports_status_idx").on(t.status),
  ],
);

export const insertReportSchema = createInsertSchema(reportsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
