import {
  bigint,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const groupsTable = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: text("status").notNull().default("pending"),
    // 'pending' | 'matched' | 'revealed' | 'completed' | 'cancelled'
    meetupType: text("meetup_type").notNull(), // 'coffee' | 'dinner'
    gender: text("gender").notNull(), // 'woman' | 'man'
    city: text("city").notNull(),
    area: text("area").notNull(),
    venue: text("venue"),
    meetupAt: bigint("meetup_at", { mode: "number" }), // Unix ms timestamp
    memberIds: text("member_ids").array().notNull().default([]),
    requestIds: text("request_ids").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("groups_status_idx").on(table.status),
    index("groups_created_at_idx").on(table.createdAt),
  ],
);

export const insertGroupSchema = createInsertSchema(groupsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groupsTable.$inferSelect;

export const groupMembersTable = pgTable(
  "group_members",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groupsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.groupId, table.userId] }),
    index("group_members_user_id_idx").on(table.userId),
  ],
);

export const groupRequestsTable = pgTable(
  "group_requests",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groupsTable.id, { onDelete: "cascade" }),
    requestId: uuid("request_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.groupId, table.requestId] }),
    index("group_requests_request_id_idx").on(table.requestId),
  ],
);

export type GroupMember = typeof groupMembersTable.$inferSelect;
export type GroupRequest = typeof groupRequestsTable.$inferSelect;
