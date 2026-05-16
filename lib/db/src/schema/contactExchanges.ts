import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { groupsTable } from "./groups";
import { usersTable } from "./users";

export const contactExchangesTable = pgTable(
  "contact_exchanges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groupsTable.id, { onDelete: "cascade" }),
    fromUserId: uuid("from_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    toUserId: uuid("to_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    contactValue: text("contact_value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("contact_exchanges_uniq").on(
      t.groupId,
      t.fromUserId,
      t.toUserId,
    ),
  ],
);

export type ContactExchange = typeof contactExchangesTable.$inferSelect;
