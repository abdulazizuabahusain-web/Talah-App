import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { usersTable } from "./users";

export const otpTable = pgTable(
  "otp",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phone: text("phone").notNull(),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("otp_phone_idx").on(table.phone),
    index("otp_expires_at_idx").on(table.expiresAt),
  ],
);

export const sessionsTable = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const insertOtpSchema = createInsertSchema(otpTable).omit({
  id: true,
  createdAt: true,
});
export const insertSessionSchema = createInsertSchema(sessionsTable).omit({
  id: true,
  createdAt: true,
});

export type Otp = typeof otpTable.$inferSelect;
export type Session = typeof sessionsTable.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
