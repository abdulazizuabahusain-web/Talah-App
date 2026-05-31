import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const venuesTable = pgTable(
  "venues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    area: text("area"),
    type: text("type").notNull().default("both"), // 'coffee' | 'dinner' | 'both'
    googleMapsUrl: text("google_maps_url"),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (t) => [
    index("venues_city_idx").on(t.city),
    index("venues_active_idx").on(t.active),
  ],
);

export const insertVenueSchema = createInsertSchema(venuesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = typeof venuesTable.$inferSelect;
