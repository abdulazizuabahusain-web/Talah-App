import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull().unique(),
  nickname: text("nickname"),
  gender: text("gender"), // 'woman' | 'man'
  city: text("city"),
  ageRange: text("age_range"), // '18-24' | '25-29' | '30-34' | '35-44' | '45+'
  lifestyle: text("lifestyle"), // 'employee' | 'student' | 'parent' | 'entrepreneur' | 'other'
  interests: text("interests").array().notNull().default([]),
  personality: text("personality"), // 'calm' | 'social' | 'curious' | 'active' | 'creative'
  preferredMeetup: text("preferred_meetup"), // 'coffee' | 'dinner'
  preferredDays: text("preferred_days").array().notNull().default([]),
  preferredTimes: text("preferred_times").array().notNull().default([]),
  funFact: text("fun_fact"),
  // Personality/compatibility fields
  socialEnergy: text("social_energy"),
  conversationStyle: text("conversation_style"),
  enjoyedTopics: text("enjoyed_topics").array().notNull().default([]),
  socialIntent: text("social_intent"),
  planningPreference: text("planning_preference"),
  meetupAtmosphere: text("meetup_atmosphere"),
  interactionPreference: text("interaction_preference"),
  personalityTraits: text("personality_traits").array().notNull().default([]),
  opennessLevel: text("openness_level"),
  socialBoundary: text("social_boundary"),
  // Computed scores
  socialEnergyScore: integer("social_energy_score"),
  conversationDepthScore: integer("conversation_depth_score"),
  planningScore: integer("planning_score"),
  atmosphereScore: integer("atmosphere_score"),
  interactionScore: integer("interaction_score"),
  opennessScore: integer("openness_score"),
  boundaryScore: integer("boundary_score"),
  // Safety
  // blockedUserIds: list of user IDs this user has blocked — they will never be co-matched
  blockedUserIds: text("blocked_user_ids").array().notNull().default([]),
  // Push notifications — Expo push token, registered on device at app start
  expoPushToken: text("expo_push_token"),
  // Status
  onboarded: boolean("onboarded").notNull().default(false),
  verified: boolean("verified").notNull().default(false),
  flagged: boolean("flagged").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
