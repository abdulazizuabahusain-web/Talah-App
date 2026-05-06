const BASE = "/api";

export interface Paginated<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

function toQuery(params?: { limit?: number; offset?: number }): string {
  if (!params) return "";
  const q = new URLSearchParams();
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.offset !== undefined) q.set("offset", String(params.offset));
  const s = q.toString();
  return s ? `?${s}` : "";
}

function getToken(): string | null {
  return localStorage.getItem("talah_admin_token");
}

export function setToken(t: string) {
  localStorage.setItem("talah_admin_token", t);
}

export function clearToken() {
  localStorage.removeItem("talah_admin_token");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  adminLogin: (pin: string) =>
    request<{ token: string }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ pin }),
    }),
  adminMe: () => request<{ ok: boolean }>("/admin/me"),

  getUsers: (params?: { limit?: number; offset?: number }) =>
    request<Paginated<User>>(`/admin/users${toQuery(params)}`),
  patchUser: (id: string, data: Partial<User>) =>
    request<User>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteUser: (id: string) =>
    request<{ ok: boolean }>(`/admin/users/${id}`, { method: "DELETE" }),

  getRequests: (params?: { limit?: number; offset?: number }) =>
    request<Paginated<MeetupRequest>>(`/admin/requests${toQuery(params)}`),
  patchRequest: (id: string, data: Partial<MeetupRequest>) =>
    request<MeetupRequest>(`/admin/requests/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  getGroups: (params?: { limit?: number; offset?: number }) =>
    request<Paginated<Group>>(`/admin/groups${toQuery(params)}`),
  createGroup: (data: CreateGroupInput) =>
    request<Group>("/admin/groups", { method: "POST", body: JSON.stringify(data) }),
  patchGroup: (id: string, data: Partial<Group>) =>
    request<Group>(`/admin/groups/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  getFeedback: () => request<Feedback[]>("/admin/feedback"),
  getReports: () => request<Report[]>("/admin/reports"),

  checkCompatibility: (userIds: string[]) =>
    request<CompatibilityReport>("/admin/compatibility", {
      method: "POST",
      body: JSON.stringify({ userIds }),
    }),

  getCandidates: (requestId: string) =>
    request<Candidate[]>(`/admin/requests/${requestId}/candidates`),
};

// ── Types (mirror the DB schema) ─────────────────────────────────────────────
export interface User {
  id: string;
  phone: string;
  nickname: string | null;
  gender: string | null;
  city: string | null;
  ageRange: string | null;
  lifestyle: string | null;
  interests: string[];
  personality: string | null;
  preferredMeetup: string | null;
  preferredDays: string[];
  preferredTimes: string[];
  funFact: string | null;
  socialEnergy: string | null;
  conversationStyle: string | null;
  enjoyedTopics: string[];
  socialIntent: string | null;
  planningPreference: string | null;
  meetupAtmosphere: string | null;
  interactionPreference: string | null;
  personalityTraits: string[];
  opennessLevel: string | null;
  socialBoundary: string | null;
  socialEnergyScore: number | null;
  conversationDepthScore: number | null;
  planningScore: number | null;
  atmosphereScore: number | null;
  interactionScore: number | null;
  opennessScore: number | null;
  boundaryScore: number | null;
  onboarded: boolean;
  verified: boolean;
  flagged: boolean;
  isAdmin: boolean;
  blockedUserIds: string[] | null;
  expoPushToken: string | null;
  createdAt: string;
}

export interface MeetupRequest {
  id: string;
  userId: string;
  meetupType: string;
  preferredDate: string;
  preferredTime: string;
  area: string;
  status: string;
  createdAt: string;
}

export interface Group {
  id: string;
  status: string;
  meetupType: string;
  gender: string;
  city: string;
  area: string;
  venue: string | null;
  meetupAt: number | null;
  memberIds: string[];
  requestIds: string[];
  createdAt: string;
}

export interface CreateGroupInput {
  meetupType: "coffee" | "dinner";
  gender: "woman" | "man";
  city: string;
  area: string;
  memberIds: string[];
  requestIds?: string[];
  venue?: string;
  meetupAt?: number;
}

export interface FeedbackConnection {
  userId: string;
  verdict: "connect" | "pass";
}

export interface Feedback {
  id: string;
  groupId: string;
  fromUserId: string;
  rating: number;
  comment: string | null;
  wouldMeetAgain: string | null;
  connections: FeedbackConnection[] | null;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetUserId: string;
  reason: string;
  createdAt: string;
}

export interface Candidate {
  userId: string;
  nickname: string | null;
  city: string | null;
  ageRange: string | null;
  gender: string | null;
  preferredMeetup: string | null;
  socialEnergyScore: number | null;
  conversationDepthScore: number | null;
  socialIntent: string | null;
  score: number;
  requestId: string;
  preferredDate: string;
  preferredTime: string;
  area: string;
}

export interface CompatibilityReport {
  overallScore: number;
  label: "excellent" | "good" | "moderate" | "weak";
  warnings: string[];
  genderOk: boolean;
  cityOk: boolean;
  availabilityOk: boolean;
  commonDays: string[];
  commonTimes: string[];
  sharedInterests: string[];
  interestOverlapPct: number;
  lifestyleAligned: boolean;
  lifestyleNote: string;
  avgEnergyScore: number;
  energyBalance: string;
  energyNote: string;
  convCompatible: boolean;
  convNote: string;
  intentNote: string;
  boundaryNote: string;
}
