import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { usersTable } from "./users";

export const surveysTable = pgTable("surveys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'micro' | 'exit'
  responses: jsonb("responses").notNull(), // free-form key-value answers
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertSurveySchema = createInsertSchema(surveysTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type Survey = typeof surveysTable.$inferSelect;
