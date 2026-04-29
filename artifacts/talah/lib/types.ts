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

export type GroupStatus =
  | "pending"
  | "matched"
  | "revealed"
  | "completed"
  | "cancelled";

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
  connections: { userId: string; verdict: "connect" | "pass" }[];
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
