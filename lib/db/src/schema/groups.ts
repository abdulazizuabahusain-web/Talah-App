import {
  bigint,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const groupsTable = pgTable("groups", {
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGroupSchema = createInsertSchema(groupsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groupsTable.$inferSelect;
