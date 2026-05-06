export type Gender = "woman" | "man";

export type Lifestyle =
  | "employee"
  | "student"
  | "parent"
  | "entrepreneur"
  | "other";

export type Interest =
  | "coffee"
  | "books"
  | "fitness"
  | "wellness"
  | "art"
  | "business"
  | "food"
  | "outdoor"
  | "self_development";

export type Personality =
  | "calm"
  | "social"
  | "curious"
  | "active"
  | "creative";

export type PersonalityTrait =
  | "calm"
  | "social"
  | "curious"
  | "thoughtful"
  | "energetic"
  | "funny"
  | "organized"
  | "creative";

export type MeetupType = "coffee" | "dinner";

export type AgeRange = "18-24" | "25-29" | "30-34" | "35-44" | "45+";

export type DayOfWeek =
  | "sat"
  | "sun"
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri";

export type TimeOfDay = "morning" | "afternoon" | "evening";

export type SocialEnergy =
  | "very_social"
  | "friendly_balanced"
  | "quiet_open_later"
  | "prefer_listening";

export type ConversationStyle = "light_fun" | "balanced" | "deep_meaningful";

export type EnjoyedTopic =
  | "daily_life"
  | "work_ambition"
  | "family_relationships"
  | "travel"
  | "wellness_growth"
  | "hobbies_activities";

export type SocialIntent =
  | "new_friends"
  | "expand_circle"
  | "casual_conversations"
  | "long_term_connections";

export type PlanningPreference = "structured" | "flexible" | "spontaneous";

export type MeetupAtmosphere = "calm_relaxed" | "moderate_energy" | "lively_energetic";

export type InteractionPreference =
  | "mostly_conversation"
  | "mix_conversation_activity"
  | "activity_based";

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
  planningScore: number;
  atmosphereScore: number;
  interactionScore: number;
  opennessScore: number;
  boundaryScore: number;
}

export interface User {
  id: string;
  phone: string;
  nickname: string;
  gender: Gender;
  city: string;
  ageRange: AgeRange;
  lifestyle: Lifestyle;
  interests: Interest[];
  personality: Personality;
  preferredMeetup: MeetupType;
  preferredDays: DayOfWeek[];
  preferredTimes: TimeOfDay[];
  funFact?: string;
  verified: boolean;
  flagged: boolean;
  onboarded: boolean;
  createdAt: number;

  socialEnergy?: SocialEnergy;
  conversationStyle?: ConversationStyle;
  enjoyedTopics?: EnjoyedTopic[];
  socialIntent?: SocialIntent;
  planningPreference?: PlanningPreference;
  meetupAtmosphere?: MeetupAtmosphere;
  interactionPreference?: InteractionPreference;
  personalityTraits?: PersonalityTrait[];
  opennessLevel?: OpennessLevel;
  socialBoundary?: SocialBoundary;

  socialEnergyScore?: number;
  conversationDepthScore?: number;
  planningScore?: number;
  atmosphereScore?: number;
  interactionScore?: number;
  opennessScore?: number;
  boundaryScore?: number;

  // Block list — IDs of users this user has blocked; excluded from future matching
  blockedUserIds?: string[];
}

export interface TalahRequest {
  id: string;
  userId: string;
  meetupType: MeetupType;
  preferredDate: string;
  preferredTime: TimeOfDay;
  area: string;
  status: "pending" | "matched" | "cancelled";
  createdAt: number;
  groupId?: string;
}

export interface Group {
  id: string;
  status: GroupStatus;
  meetupType: MeetupType;
  gender: Gender;
  city: string;
  area: string;
  venue?: string;
  meetupAt?: number;
  memberIds: string[];
  requestIds: string[];
  createdAt: number;
}

export interface FeedbackEntry {
  id: string;
  groupId: string;
  fromUserId: string;
  rating: number;
  connections?: { userId: string; verdict: "connect" | "pass" }[];
  wouldMeetAgain?: "yes" | "maybe" | "no";
  comment?: string;
  createdAt: number;
}

export interface ReportEntry {
  id: string;
  reporterId: string;
  targetUserId: string;
  groupId?: string;
  reason: string;
  createdAt: number;
}

function lookup(map: Record<string, number>, key: string | undefined): number | undefined {
  return key !== undefined ? map[key] : undefined;
}

export function computeScores(user: Partial<User>): Partial<UserScores> {
  const socialEnergyScore = lookup({
    very_social: 2,
    friendly_balanced: 1,
    quiet_open_later: -1,
    prefer_listening: -2,
  }, user.socialEnergy);

  const conversationDepthScore = lookup({
    light_fun: -1,
    balanced: 0,
    deep_meaningful: 1,
  }, user.conversationStyle);

  const planningScore = lookup({
    structured: 1,
    flexible: 0,
    spontaneous: -1,
  }, user.planningPreference);

  const atmosphereScore = lookup({
    calm_relaxed: -1,
    moderate_energy: 0,
    lively_energetic: 1,
  }, user.meetupAtmosphere);

  const interactionScore = lookup({
    mostly_conversation: -1,
    mix_conversation_activity: 0,
    activity_based: 1,
  }, user.interactionPreference);

  const opennessScore = lookup({
    open_quickly: 1,
    open_gradually: 0,
    take_your_time: -1,
  }, user.opennessLevel);

  const boundaryScore = lookup({
    very_relaxed: 1,
    respectful_balanced: 0,
    more_reserved: -1,
  }, user.socialBoundary);

  return {
    socialEnergyScore,
    conversationDepthScore,
    planningScore,
    atmosphereScore,
    interactionScore,
    opennessScore,
    boundaryScore,
  };
}

export function generateMatchingNotes(user: User): string[] {
  const notes: string[] = [];
  const se = user.socialEnergyScore;
  const cd = user.conversationDepthScore;
  const at = user.atmosphereScore;
  const ip = user.interactionScore;
  const bs = user.boundaryScore;
  const intent = user.socialIntent;

  if (se !== undefined) {
    if (se >= 2) notes.push("High-energy social user");
    else if (se <= -1) notes.push("Reserved user; best matched with balanced group");
  }
  if (cd !== undefined) {
    if (cd >= 1) notes.push("Prefers deep conversations");
    else if (cd <= -1) notes.push("Prefers light and fun conversations");
  }
  if (at !== undefined) {
    if (at <= -1) notes.push("Prefers calm meetups");
    else if (at >= 1) notes.push("Enjoys lively atmospheres");
  }
  if (ip !== undefined) {
    if (ip >= 1) notes.push("Activity-oriented user");
  }
  if (bs !== undefined) {
    if (bs <= -1) notes.push("Strong privacy preference");
  }
  if (intent === "long_term_connections") {
    notes.push("Best for long-term connection groups");
  } else if (intent === "new_friends" || intent === "expand_circle" || intent === "casual_conversations") {
    notes.push("Best for casual/social-circle expansion groups");
  }
  return notes;
}
