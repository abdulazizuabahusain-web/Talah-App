import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { requestsTable } from "./requests";
import { usersTable } from "./users";

export const requestInvitationsTable = pgTable(
  "request_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => requestsTable.id, { onDelete: "cascade" }),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    invitedEmail: text("invited_email").notNull(),
    inviteeUserId: uuid("invitee_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    tokenHash: text("token_hash").notNull(),
    status: text("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("request_invitations_request_unique").on(table.requestId),
    index("request_invitations_email_idx").on(table.invitedEmail),
    index("request_invitations_invitee_idx").on(table.inviteeUserId),
    index("request_invitations_status_idx").on(table.status),
  ],
);

export type RequestInvitation = typeof requestInvitationsTable.$inferSelect;