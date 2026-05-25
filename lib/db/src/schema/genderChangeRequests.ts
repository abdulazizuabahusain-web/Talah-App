import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const talahTypeChangeRequestsTable = pgTable(
  "talah_type_change_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    currentGender: text("current_gender").notNull(),
    requestedGender: text("requested_gender").notNull(),
    reason: text("reason"),
    status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: text("reviewed_by"),
    adminNotes: text("admin_notes"),
  },
  (table) => [
    index("tcr_user_id_idx").on(table.userId),
    index("tcr_status_idx").on(table.status),
  ],
);

export type TalahTypeChangeRequest = typeof talahTypeChangeRequestsTable.$inferSelect;
