import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { groupsTable } from "./groups";
import { usersTable } from "./users";

export const feedbackTable = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groupsTable.id, { onDelete: "cascade" }),
    fromUserId: uuid("from_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    comfortRating: integer("comfort_rating").notNull(),
    groupFit: text("group_fit"),
    wouldJoinAgain: text("would_join_again"),
    venueRating: integer("venue_rating"),
    venueSuitable: text("venue_suitable"),
    safetyConcern: boolean("safety_concern").notNull().default(false),
    safetyConcernDetails: text("safety_concern_details"),
    comment: text("comment"),
    connections: jsonb("connections").$type<
      { userId: string; verdict: "connect" | "pass" }[]
    >(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("feedback_user_group_unique").on(t.fromUserId, t.groupId),
  ],
);

export const insertFeedbackSchema = createInsertSchema(feedbackTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbackTable.$inferSelect;
