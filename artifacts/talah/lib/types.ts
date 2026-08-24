export type Gender = "woman" | "man";

export type LifeStage =
  | "university_early"
  | "early_career"
  | "professionally_established"
  | "have_family"
  | "prefer_not_to_say";

// @deprecated — kept for backward compat; no longer collected in onboarding
export type Lifestyle =
  | "employee"
  | "student"
  | "parent"
  | "entrepreneur"
  | "other";

// @deprecated — kept for backward compat; no longer collected in onboarding
export type AgeRange = "18-24" | "25-29" | "30-34" | "35-44" | "45+";

export type Interest =
  // Food & Coffee
  | "coffee"
  | "restaurants"
  | "cooking"
  | "desserts"
  // Wellness
  | "fitness"
  | "walking"
  | "wellness"
  | "yoga"
  // Creativity & Hobbies
  | "photography"
  | "art"
  | "writing"
  | "music"
  // Life & Experiences
  | "travel"
  | "social_convos"
  | "self_development"
  | "business"
  // Entertainment
  | "movies"
  | "games"
  | "anime"
  // Outdoor
  | "hiking"
  | "sea_outdoor"
  | "camping"
  // Culture & Community
  | "reading"
  | "podcasts"
  | "volunteering"
  // Tech
  | "tech"
  // Fashion
  | "fashion"
  // Entertainment extras
  | "sports_watching";

// @deprecated — kept for backward compat
export type Personality = "calm" | "social" | "curious" | "active" | "creative";

export type PersonalityTrait =
  | "calm"
  | "social"
  | "curious"
  | "energetic"
  | "funny"
  | "creative";

export type MeetupType = "coffee" | "dinner";

// @deprecated — kept for backward compat; scheduling moved to request flow
export type DayOfWeek = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";
export type TimeOfDay = "morning" | "afternoon" | "evening";

export type SocialEnergy =
  | "very_social"
  | "friendly_balanced"
  | "quiet_open_later"
  | "prefer_listening";

export type ConversationStyle = "light_fun" | "balanced" | "deep_meaningful";

// @deprecated — no longer collected in onboarding
export type EnjoyedTopic =
  | "daily_life"
  | "work_ambition"
  | "family_relationships"
  | "travel"
  | "wellness_growth"
  | "hobbies_activities";

// @deprecated — no longer collected in onboarding
export type SocialIntent =
  | "new_friends"
  | "expand_circle"
  | "casual_conversations"
  | "long_term_connections";

// @deprecated — no longer collected in onboarding
export type PlanningPreference = "structured" | "flexible" | "spontaneous";
export type MeetupAtmosphere = "calm_relaxed" | "moderate_energy" | "lively_energetic";
export type InteractionPreference = "mostly_conversation" | "mix_conversation_activity" | "activity_based";
export type OpennessLevel = "open_quickly" | "open_gradually" | "take_your_time";
export type SocialBoundary = "very_relaxed" | "respectful_balanced" | "more_reserved";

export type GroupStatus =
  | "pending"
  | "matched"
  | "revealed"
  | "completed"
  | "cancelled";

export interface UserScores {
  socialEnergyScore: number;
  conversationDepthScore: number;
  // @deprecated — no longer computed
  planningScore?: number;
  atmosphereScore?: number;
  interactionScore?: number;
  opennessScore?: number;
  boundaryScore?: number;
}

export interface ContactInfo {
  contactPhone?: string | null;
  instagram?: string | null;
  snapchat?: string | null;
  twitter?: string | null;
  tiktok?: string | null;
}

export interface User {
  id: string;
  phone: string;
  email?: string | null;
  nickname: string;
  gender: Gender;
  city: string;
  lifeStage?: LifeStage | null;
  interests: Interest[];
  preferredMeetup: MeetupType;
  verified: boolean;
  flagged: boolean;
  onboarded: boolean;
  createdAt: number;

  socialEnergy?: SocialEnergy;
  conversationStyle?: ConversationStyle;
  personalityTraits?: PersonalityTrait[];

  socialEnergyScore?: number;
  conversationDepthScore?: number;

  // @deprecated fields — kept so old data doesn't break runtime
  ageRange?: AgeRange;
  lifestyle?: Lifestyle;
  personality?: Personality;
  preferredDays?: DayOfWeek[];
  preferredTimes?: TimeOfDay[];
  funFact?: string;
  enjoyedTopics?: EnjoyedTopic[];
  socialIntent?: SocialIntent;
  planningPreference?: PlanningPreference;
  meetupAtmosphere?: MeetupAtmosphere;
  interactionPreference?: InteractionPreference;
  opennessLevel?: OpennessLevel;
  socialBoundary?: SocialBoundary;
  planningScore?: number;
  atmosphereScore?: number;
  interactionScore?: number;
  opennessScore?: number;
  boundaryScore?: number;

  // Block list
  blockedUserIds?: string[];

  // Contact info — private; only revealed to mutual connects
  contactPhone?: string | null;
  instagram?: string | null;
  snapchat?: string | null;
  twitter?: string | null;
  tiktok?: string | null;
}

export type InvitationStatus = "pending" | "accepted" | "declined" | "expired" | "finalized";

export interface RequestInvitation {
  id: string;
  requestId: string;
  requesterId: string;
  invitedEmail: string;
  inviteeUserId: string | null;
  status: InvitationStatus;
  expiresAt: string;
  respondedAt: string | null;
  createdAt: string;
}

export interface TalahRequest {
  id: string;
  userId: string;
  meetupType: MeetupType;
  preferredDate: string;
  preferredTime: TimeOfDay;
  area: string;
  venueId?: string | null;
  friendEmail?: string;
  status: "pending" | "matched" | "cancelled";
  createdAt: number;
  groupId?: string;
  invitation?: RequestInvitation | null;
}

export interface Group {
  id: string;
  status: GroupStatus;
  meetupType: MeetupType;
  gender: Gender;
  city: string;
  area: string;
  venue?: string;
  googleMapsUrl?: string | null;
  meetupAt?: number;
  memberIds: string[];
  requestIds: string[];
  createdAt: number;
}

export interface ApiVenue {
  id: string;
  name: string;
  city: string;
  area: string | null;
  type: string;
  googleMapsUrl: string | null;
  notes: string | null;
}

export interface FeedbackEntry {
  id: string;
  groupId: string;
  fromUserId: string;
  comfortRating: number;
  groupFit?: "very_suitable" | "somewhat" | "not_suitable";
  wouldJoinAgain?: "yes" | "maybe" | "no";
  venueRating?: number;
  venueSuitable?: "yes" | "maybe" | "no";
  safetyConcern: boolean;
  safetyConcernDetails?: string;
  connections?: { userId: string; verdict: "connect" | "pass" }[];
  comment?: string;
  createdAt: number;
}

export interface ReportEntry {
  id: string;
  reporterId: string;
  targetUserId: string;
  groupId?: string;
  reportCategory?: string;
  reason: string;
  details?: string;
  createdAt: number;
}

function lookup(
  map: Record<string, number>,
  key: string | undefined,
): number | undefined {
  return key !== undefined ? map[key] : undefined;
}

export function computeScores(user: Partial<User>): Partial<UserScores> {
  const socialEnergyScore = lookup(
    {
      very_social: 2,
      friendly_balanced: 1,
      quiet_open_later: -1,
      prefer_listening: -2,
    },
    user.socialEnergy,
  );

  const conversationDepthScore = lookup(
    {
      light_fun: -1,
      balanced: 0,
      deep_meaningful: 1,
    },
    user.conversationStyle,
  );

  return { socialEnergyScore, conversationDepthScore };
}

export function generateMatchingNotes(user: User): string[] {
  const notes: string[] = [];
  const se = user.socialEnergyScore;
  const cd = user.conversationDepthScore;

  if (se !== undefined) {
    if (se >= 2) notes.push("High-energy social user");
    else if (se <= -1) notes.push("Reserved — best matched with a balanced group");
  }
  if (cd !== undefined) {
    if (cd >= 1) notes.push("Prefers deeper conversations");
    else if (cd <= -1) notes.push("Prefers light and fun conversations");
  }
  return notes;
}
