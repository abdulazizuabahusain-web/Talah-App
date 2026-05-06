import type { User, TalahRequest, Group } from "@/lib/types";

const BASE = (process.env["EXPO_PUBLIC_API_BASE"] ?? "/api").replace(/\/$/, "");

let _token: string | null = null;

export function setToken(t: string | null) {
  _token = t;
}

export function getToken(): string | null {
  return _token;
}

type ReqOpts = {
  method?: string;
  body?: unknown;
};

async function req<T>(path: string, opts: ReqOpts = {}): Promise<T> {
  const { method = "GET", body } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    const e = new Error(err.error ?? `Request failed (${res.status})`);
    (e as Error & { status: number }).status = res.status;
    throw e;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Response shapes from DB (camelCase, timestamps as ISO strings) ───────────

export interface ApiUser {
  id: string;
  phone: string;
  nickname: string;
  gender: "woman" | "man";
  city: string;
  ageRange: string;
  lifestyle: string;
  interests: string[];
  personality: string;
  preferredMeetup: string;
  preferredDays: string[];
  preferredTimes: string[];
  funFact: string | null;
  verified: boolean;
  flagged: boolean;
  onboarded: boolean;
  isAdmin: boolean;
  socialEnergy: string | null;
  conversationStyle: string | null;
  enjoyedTopics: string[] | null;
  socialIntent: string | null;
  planningPreference: string | null;
  meetupAtmosphere: string | null;
  interactionPreference: string | null;
  personalityTraits: string[] | null;
  opennessLevel: string | null;
  socialBoundary: string | null;
  socialEnergyScore: number | null;
  conversationDepthScore: number | null;
  planningScore: number | null;
  atmosphereScore: number | null;
  interactionScore: number | null;
  opennessScore: number | null;
  boundaryScore: number | null;
  blockedUserIds: string[];
  createdAt: string;
}

export interface ApiRequest {
  id: string;
  userId: string;
  meetupType: "coffee" | "dinner";
  preferredDate: string;
  preferredTime: "morning" | "afternoon" | "evening";
  area: string;
  status: "pending" | "matched" | "cancelled";
  groupId: string | null;
  createdAt: string;
}

export type ApiGroupMember = Pick<ApiUser,
  "id" | "nickname" | "gender" | "ageRange" | "lifestyle" | "personality" |
  "verified" | "funFact" | "personalityTraits"
>;

export interface ApiGroup {
  id: string;
  status: "pending" | "matched" | "revealed" | "completed" | "cancelled";
  meetupType: "coffee" | "dinner";
  gender: "woman" | "man";
  city: string;
  area: string;
  venue: string | null;
  meetupAt: string | null;
  memberIds: string[];
  requestIds: string[];
  members: ApiGroupMember[];
  createdAt: string;
}

// ─── Conversion helpers ────────────────────────────────────────────────────────

function ts(d: string | null | undefined): number {
  return d ? new Date(d).getTime() : 0;
}

function nullToUndefined<T>(v: T | null | undefined): T | undefined {
  return v ?? undefined;
}

export function toUser(u: ApiUser | ApiGroupMember): User {
  const a = u as ApiUser;
  return {
    id: u.id,
    phone: (a.phone as string | null | undefined) ?? "",
    nickname: (u.nickname as string | null | undefined) ?? "",
    gender: ((u.gender as string | null | undefined) ?? "woman") as User["gender"],
    city: ((a.city as string | null | undefined) ?? ""),
    ageRange: (((u.ageRange as string | null | undefined) ?? "25-29") as User["ageRange"]),
    lifestyle: (((u.lifestyle as string | null | undefined) ?? "other") as User["lifestyle"]),
    interests: ((a.interests as string[] | null | undefined) ?? []) as User["interests"],
    personality: (((u.personality as string | null | undefined) ?? "calm") as User["personality"]),
    preferredMeetup: (((a.preferredMeetup as string | null | undefined) ?? "coffee") as User["preferredMeetup"]),
    preferredDays: ((a.preferredDays as string[] | null | undefined) ?? []) as User["preferredDays"],
    preferredTimes: ((a.preferredTimes as string[] | null | undefined) ?? []) as User["preferredTimes"],
    funFact: nullToUndefined(u.funFact as string | null | undefined),
    verified: (a.verified as boolean | null | undefined) ?? false,
    flagged: (a.flagged as boolean | null | undefined) ?? false,
    onboarded: (a.onboarded as boolean | null | undefined) ?? false,
    createdAt: a.createdAt ? ts(a.createdAt) : 0,
    socialEnergy: nullToUndefined(a.socialEnergy) as User["socialEnergy"],
    conversationStyle: nullToUndefined(a.conversationStyle) as User["conversationStyle"],
    enjoyedTopics: nullToUndefined(a.enjoyedTopics) as User["enjoyedTopics"],
    socialIntent: nullToUndefined(a.socialIntent) as User["socialIntent"],
    planningPreference: nullToUndefined(a.planningPreference) as User["planningPreference"],
    meetupAtmosphere: nullToUndefined(a.meetupAtmosphere) as User["meetupAtmosphere"],
    interactionPreference: nullToUndefined(a.interactionPreference) as User["interactionPreference"],
    personalityTraits: nullToUndefined(u.personalityTraits as string[] | null | undefined) as User["personalityTraits"],
    opennessLevel: nullToUndefined(a.opennessLevel) as User["opennessLevel"],
    socialBoundary: nullToUndefined(a.socialBoundary) as User["socialBoundary"],
    socialEnergyScore: nullToUndefined(a.socialEnergyScore),
    conversationDepthScore: nullToUndefined(a.conversationDepthScore),
    planningScore: nullToUndefined(a.planningScore),
    atmosphereScore: nullToUndefined(a.atmosphereScore),
    interactionScore: nullToUndefined(a.interactionScore),
    opennessScore: nullToUndefined(a.opennessScore),
    boundaryScore: nullToUndefined(a.boundaryScore),
    blockedUserIds: (a.blockedUserIds as string[] | null | undefined) ?? [],
  };
}

export function toRequest(r: ApiRequest): TalahRequest {
  return {
    id: r.id,
    userId: r.userId,
    meetupType: r.meetupType,
    preferredDate: r.preferredDate,
    preferredTime: r.preferredTime,
    area: r.area,
    status: r.status,
    groupId: nullToUndefined(r.groupId),
    createdAt: ts(r.createdAt),
  };
}

export function toGroup(g: ApiGroup): Group & { _members: User[] } {
  return {
    id: g.id,
    status: g.status,
    meetupType: g.meetupType,
    gender: g.gender,
    city: g.city,
    area: g.area,
    venue: nullToUndefined(g.venue),
    meetupAt: g.meetupAt ? ts(g.meetupAt) : undefined,
    memberIds: g.memberIds,
    requestIds: g.requestIds,
    createdAt: ts(g.createdAt),
    _members: (g.members ?? []).map(toUser),
  };
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const api = {
  // Auth
  sendOtp: (phone: string) =>
    req<{ ok: boolean; code?: string }>("/auth/otp/send", { method: "POST", body: { phone } }),

  verifyOtp: (phone: string, code: string) =>
    req<{ token: string; user: ApiUser }>("/auth/otp/verify", { method: "POST", body: { phone, code } }),

  logout: () =>
    req<{ ok: boolean }>("/auth/logout", { method: "POST" }),

  // Users
  me: () => req<ApiUser>("/users/me"),
  updateMe: (patch: Partial<ApiUser>) =>
    req<ApiUser>("/users/me", { method: "PATCH", body: patch }),
  deleteMe: () =>
    req<{ ok: boolean }>("/users/me", { method: "DELETE" }),

  // Requests
  getRequests: () => req<ApiRequest[]>("/requests"),
  createRequest: (body: {
    meetupType: "coffee" | "dinner";
    preferredDate: string;
    preferredTime: "morning" | "afternoon" | "evening";
    area: string;
  }) => req<ApiRequest>("/requests", { method: "POST", body }),
  cancelRequest: (id: string) => req<{ ok: boolean }>(`/requests/${id}`, { method: "DELETE" }),

  // Groups
  getGroups: () => req<ApiGroup[]>("/groups"),
  getGroup: (id: string) => req<ApiGroup>(`/groups/${id}`),
  getMutualConnects: (groupId: string) =>
    req<{ mutualConnects: { id: string; nickname: string | null; personalityTraits: string[] }[]; hasFeedback: boolean }>(
      `/groups/${groupId}/mutual-connects`,
    ),

  // Feedback
  submitFeedback: (body: {
    groupId: string;
    rating: number;
    connections?: { userId: string; verdict: "connect" | "pass" }[];
    wouldMeetAgain?: "yes" | "maybe" | "no";
    comment?: string;
  }) => req<void>("/feedback", { method: "POST", body }),

  // Reports
  submitReport: (body: {
    targetUserId: string;
    groupId?: string;
    reason: string;
  }) => req<void>("/reports", { method: "POST", body }),

  // Safety — Block
  blockUser: (targetId: string) =>
    req<{ ok: boolean; blockedUserIds: string[] }>(`/users/block/${targetId}`, { method: "POST" }),
  getBlocked: () =>
    req<{ blockedUserIds: string[] }>("/users/blocked"),
};
