import type { TalahRequest, User } from "./types";

export interface MatchCandidate {
  user: User;
  request: TalahRequest;
  score: number;
}

const AGE_ORDER = ["18-24", "25-29", "30-34", "35-44", "45+"];

export function ageDistance(a: User, b: User): number {
  return Math.abs(AGE_ORDER.indexOf(a.ageRange) - AGE_ORDER.indexOf(b.ageRange));
}

export function sharedInterestCount(a: User, b: User): number {
  const setB = new Set(b.interests);
  return a.interests.filter((i) => setB.has(i)).length;
}

export function scorePair(a: User, b: User): number {
  const interestScore = sharedInterestCount(a, b) * 3;
  const ageScore = Math.max(0, 4 - ageDistance(a, b)) * 2;
  const lifestyleScore = a.lifestyle === b.lifestyle ? 2 : 0;
  // Personality balance: same is fine, different is also fine but slight bonus for similar
  const personalityScore = a.personality === b.personality ? 1 : 0;
  return interestScore + ageScore + lifestyleScore + personalityScore;
}

export function findCandidatesFor(
  request: TalahRequest,
  requester: User,
  allUsers: User[],
  allRequests: TalahRequest[],
): MatchCandidate[] {
  const candidates: MatchCandidate[] = [];
  for (const r of allRequests) {
    if (r.id === request.id) continue;
    if (r.status !== "pending") continue;
    if (r.meetupType !== request.meetupType) continue;
    const u = allUsers.find((x) => x.id === r.userId);
    if (!u) continue;
    // Hard filters
    if (u.gender !== requester.gender) continue;
    if (u.city !== requester.city) continue;
    // Overlapping availability: same preferred date OR overlapping day-of-week
    const sameDate = r.preferredDate === request.preferredDate;
    const overlapTime = r.preferredTime === request.preferredTime;
    if (!sameDate && !overlapTime) continue;
    const score = scorePair(requester, u);
    candidates.push({ user: u, request: r, score });
  }
  return candidates.sort((a, b) => b.score - a.score);
}
