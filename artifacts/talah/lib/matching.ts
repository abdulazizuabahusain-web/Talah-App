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

export function sharedTopicCount(a: User, b: User): number {
  const at = a.enjoyedTopics ?? [];
  const bt = new Set(b.enjoyedTopics ?? []);
  return at.filter((t) => bt.has(t)).length;
}

export function scorePair(a: User, b: User): number {
  const interestScore = sharedInterestCount(a, b) * 3;
  const topicScore = sharedTopicCount(a, b) * 2;
  const ageScore = Math.max(0, 4 - ageDistance(a, b)) * 2;
  const lifestyleScore = a.lifestyle === b.lifestyle ? 2 : 0;
  const personalityScore = a.personality === b.personality ? 1 : 0;

  const energyDiff = a.socialEnergyScore !== undefined && b.socialEnergyScore !== undefined
    ? Math.abs(a.socialEnergyScore - b.socialEnergyScore)
    : 0;
  const energyScore = energyDiff <= 1 ? 2 : energyDiff <= 2 ? 1 : 0;

  const convDiff = a.conversationDepthScore !== undefined && b.conversationDepthScore !== undefined
    ? Math.abs(a.conversationDepthScore - b.conversationDepthScore)
    : 0;
  const convScore = convDiff <= 1 ? 2 : 0;

  const intentScore = a.socialIntent && b.socialIntent && a.socialIntent === b.socialIntent ? 2 : 0;

  return interestScore + topicScore + ageScore + lifestyleScore + personalityScore + energyScore + convScore + intentScore;
}

export function findCandidatesFor(
  request: TalahRequest,
  requester: User,
  allUsers: User[],
  allRequests: TalahRequest[],
): MatchCandidate[] {
  // Build mutual block sets — exclude anyone either party has blocked
  const requesterBlocked = new Set(requester.blockedUserIds ?? []);

  const candidates: MatchCandidate[] = [];
  for (const r of allRequests) {
    if (r.id === request.id) continue;
    if (r.status !== "pending") continue;
    if (r.meetupType !== request.meetupType) continue;
    const u = allUsers.find((x) => x.id === r.userId);
    if (!u) continue;
    if (u.gender !== requester.gender) continue;
    if (u.city !== requester.city) continue;
    // Skip if either party has blocked the other
    if (requesterBlocked.has(u.id)) continue;
    if ((u.blockedUserIds ?? []).includes(requester.id)) continue;
    // Skip flagged users — admin must clear them before they can be matched
    if (u.flagged) continue;
    const sameDate = r.preferredDate === request.preferredDate;
    const overlapTime = r.preferredTime === request.preferredTime;
    if (!sameDate && !overlapTime) continue;
    const score = scorePair(requester, u);
    candidates.push({ user: u, request: r, score });
  }
  return candidates.sort((a, b) => b.score - a.score);
}

export interface CompatibilityReport {
  overallScore: number;
  label: "excellent" | "good" | "moderate" | "weak";
  genderOk: boolean;
  cityOk: boolean;
  commonDays: string[];
  commonTimes: string[];
  availabilityOk: boolean;
  sharedInterests: string[];
  interestOverlapPct: number;
  lifestyleAligned: boolean;
  lifestyleNote: string;
  energyBalance: "balanced" | "too_high" | "too_low";
  energyNote: string;
  avgEnergyScore: number;
  convCompatible: boolean;
  convNote: string;
  intentNote: string;
  boundaryNote: string;
  warnings: string[];
  notes: string[];
}

export function calculateGroupCompatibility(users: User[]): CompatibilityReport {
  const warnings: string[] = [];
  const notes: string[] = [];

  const genderOk = new Set(users.map((u) => u.gender)).size === 1;
  if (!genderOk) warnings.push("Invalid group: Tal'ah currently supports women-only or men-only gatherings only.");

  const cityOk = new Set(users.map((u) => u.city)).size === 1;
  if (!cityOk) warnings.push("Users are from different cities.");

  const dayIntersection = users
    .map((u) => new Set<string>(u.preferredDays))
    .reduce<Set<string>>((acc, s) => new Set([...acc].filter((x) => s.has(x))), new Set<string>(users[0]?.preferredDays ?? []));
  const commonDays = [...dayIntersection];

  const timeIntersection = users
    .map((u) => new Set<string>(u.preferredTimes))
    .reduce<Set<string>>((acc, s) => new Set([...acc].filter((x) => s.has(x))), new Set<string>(users[0]?.preferredTimes ?? []));
  const commonTimes = [...timeIntersection];

  const availabilityOk = commonDays.length > 0 && commonTimes.length > 0;
  if (!availabilityOk) warnings.push("No common availability window found.");

  const allInterests = users.flatMap((u) => u.interests);
  const allTopics = users.flatMap((u) => u.enjoyedTopics ?? []);
  const interestCounts = new Map<string, number>();
  [...allInterests, ...allTopics].forEach((i) => interestCounts.set(i, (interestCounts.get(i) ?? 0) + 1));
  const sharedInterests = [...interestCounts.entries()]
    .filter(([, c]) => c >= Math.ceil(users.length / 2))
    .map(([k]) => k);

  const uniqueInterests = new Set([...allInterests, ...allTopics]);
  const interestOverlapPct = uniqueInterests.size > 0
    ? Math.round((sharedInterests.length / uniqueInterests.size) * 100)
    : 0;

  const lifestyles = users.map((u) => u.lifestyle);
  const uniqueLifestyles = new Set(lifestyles);
  const lifestyleAligned = uniqueLifestyles.size === 1;
  const lifestyleNote = lifestyleAligned ? "Lifestyles are aligned." : `Mixed lifestyles: ${[...uniqueLifestyles].join(", ")}.`;

  const energyScores = users.map((u) => u.socialEnergyScore ?? 0);
  const avgEnergyScore = energyScores.reduce((a, b) => a + b, 0) / energyScores.length;
  let energyBalance: CompatibilityReport["energyBalance"] = "balanced";
  let energyNote = "Balanced social energy.";
  if (avgEnergyScore > 1) {
    energyBalance = "too_high";
    energyNote = "Group may be too high-energy.";
  } else if (avgEnergyScore < -1) {
    energyBalance = "too_low";
    energyNote = "Group may be too quiet/reserved.";
  }

  const convScores = users.map((u) => u.conversationDepthScore ?? 0);
  const convSpread = Math.max(...convScores) - Math.min(...convScores);
  const convCompatible = convSpread <= 1;
  const convNote = convCompatible
    ? "Conversation style is reasonably aligned."
    : "Conversation depth may be mismatched.";

  const intents = users.map((u) => u.socialIntent).filter(Boolean);
  const intentCounts = new Map<string, number>();
  intents.forEach((i) => intentCounts.set(i!, (intentCounts.get(i!) ?? 0) + 1));
  const topIntent = [...intentCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const intentAligned = topIntent ? topIntent[1] >= Math.ceil(users.length / 2) : false;
  const intentNote = intentAligned ? `Most users share the same social intent.` : "Social intent is varied across the group.";

  const boundaryScores = users.map((u) => u.boundaryScore ?? 0);
  const hasVeryOpen = boundaryScores.some((s) => s >= 1);
  const hasReserved = boundaryScores.some((s) => s <= -1);
  const boundaryNote =
    hasVeryOpen && hasReserved
      ? "Caution: group includes both very open and reserved members."
      : "Boundary styles are compatible.";

  const hardScore =
    ((genderOk ? 1 : 0) * 0.4 + (cityOk ? 1 : 0) * 0.4 + (availabilityOk ? 1 : 0) * 0.2) * 25;
  const interestScore = (interestOverlapPct / 100) * 25;
  const lifestyleScore = (lifestyleAligned ? 1 : 0.5) * 15;
  const energyScore = energyBalance === "balanced" ? 15 : 7;
  const convScore = (convCompatible ? 1 : 0.5) * 10;
  const intentBoundScore = (intentAligned ? 0.6 : 0.3 + (hasVeryOpen && hasReserved ? 0 : 0.4)) * 10;

  const overallScore = Math.round(hardScore + interestScore + lifestyleScore + energyScore + convScore + intentBoundScore);

  let label: CompatibilityReport["label"] = "weak";
  if (overallScore >= 85) label = "excellent";
  else if (overallScore >= 70) label = "good";
  else if (overallScore >= 55) label = "moderate";

  return {
    overallScore,
    label,
    genderOk,
    cityOk,
    commonDays,
    commonTimes,
    availabilityOk,
    sharedInterests,
    interestOverlapPct,
    lifestyleAligned,
    lifestyleNote,
    energyBalance,
    energyNote,
    avgEnergyScore,
    convCompatible,
    convNote,
    intentNote,
    boundaryNote,
    warnings,
    notes,
  };
}
