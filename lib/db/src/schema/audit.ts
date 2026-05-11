import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const adminAuditLogsTable = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorTokenHash: text("actor_token_hash"),
    action: text("action").notNull(),
    targetTable: text("target_table").notNull(),
    targetId: text("target_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("admin_audit_logs_target_idx").on(table.targetTable, table.targetId),
    index("admin_audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export type AdminAuditLog = typeof adminAuditLogsTable.$inferSelect;
