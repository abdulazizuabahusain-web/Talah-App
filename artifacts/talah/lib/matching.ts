import type { TalahRequest, User } from "./types";

export interface MatchCandidate {
  user: User;
  request: TalahRequest;
  score: number;
}

export function sharedInterestCount(a: User, b: User): number {
  const setB = new Set(b.interests);
  return a.interests.filter((i) => setB.has(i)).length;
}

export function scorePair(a: User, b: User): number {
  const interestScore = sharedInterestCount(a, b) * 3;

  const energyDiff =
    a.socialEnergyScore !== undefined && b.socialEnergyScore !== undefined
      ? Math.abs(a.socialEnergyScore - b.socialEnergyScore)
      : 0;
  const energyScore = energyDiff <= 1 ? 2 : energyDiff <= 2 ? 1 : 0;

  const convDiff =
    a.conversationDepthScore !== undefined && b.conversationDepthScore !== undefined
      ? Math.abs(a.conversationDepthScore - b.conversationDepthScore)
      : 0;
  const convScore = convDiff <= 1 ? 2 : 0;

  const lifeStageScore = a.lifeStage && b.lifeStage && a.lifeStage === b.lifeStage ? 2 : 0;

  return interestScore + energyScore + convScore + lifeStageScore;
}

export function findCandidatesFor(
  request: TalahRequest,
  requester: User,
  allUsers: User[],
  allRequests: TalahRequest[],
): MatchCandidate[] {
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
    if (requesterBlocked.has(u.id)) continue;
    if ((u.blockedUserIds ?? []).includes(requester.id)) continue;
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
  sharedInterests: string[];
  interestOverlapPct: number;
  energyBalance: "balanced" | "too_high" | "too_low";
  energyNote: string;
  avgEnergyScore: number;
  convCompatible: boolean;
  convNote: string;
  warnings: string[];
  notes: string[];
  // Kept for backward compat with display layer
  commonDays: string[];
  commonTimes: string[];
  availabilityOk: boolean;
  lifestyleAligned: boolean;
  lifestyleNote: string;
  intentNote: string;
  boundaryNote: string;
}

export function calculateGroupCompatibility(users: User[]): CompatibilityReport {
  const warnings: string[] = [];
  const notes: string[] = [];

  const genderOk = new Set(users.map((u) => u.gender)).size === 1;
  if (!genderOk) warnings.push("Invalid group: Tal'ah currently supports women-only or men-only gatherings only.");

  const cityOk = new Set(users.map((u) => u.city)).size === 1;
  if (!cityOk) warnings.push("Users are from different cities.");

  // Interest overlap (30% weight via interests, 20% meetup type)
  const allInterests = users.flatMap((u) => u.interests);
  const interestCounts = new Map<string, number>();
  allInterests.forEach((i) => interestCounts.set(i, (interestCounts.get(i) ?? 0) + 1));
  const sharedInterests = [...interestCounts.entries()]
    .filter(([, c]) => c >= Math.ceil(users.length / 2))
    .map(([k]) => k);
  const uniqueInterests = new Set(allInterests);
  const interestOverlapPct = uniqueInterests.size > 0
    ? Math.round((sharedInterests.length / uniqueInterests.size) * 100)
    : 0;

  // Meetup type alignment
  const meetupTypes = new Set(users.map((u) => u.preferredMeetup));
  const meetupAligned = meetupTypes.size === 1;
  if (!meetupAligned) notes.push("Mixed meetup preferences (coffee vs dinner)");

  // Social energy (15% weight)
  const energyScores = users.map((u) => u.socialEnergyScore ?? 0);
  const avgEnergyScore = energyScores.reduce((a, b) => a + b, 0) / energyScores.length;
  let energyBalance: CompatibilityReport["energyBalance"] = "balanced";
  let energyNote = "Balanced social energy.";
  if (avgEnergyScore > 1) {
    energyBalance = "too_high";
    energyNote = "Group may be too high-energy.";
  } else if (avgEnergyScore < -1) {
    energyBalance = "too_low";
    energyNote = "Group may be too quiet / reserved.";
  }

  // Conversation style (10% weight)
  const convScores = users.map((u) => u.conversationDepthScore ?? 0);
  const convSpread = Math.max(...convScores) - Math.min(...convScores);
  const convCompatible = convSpread <= 1;
  const convNote = convCompatible
    ? "Conversation style is aligned."
    : "Conversation depth may be mismatched.";

  // Life stage (5% weight)
  const lifeStages = new Set(users.map((u) => u.lifeStage).filter(Boolean));
  const lifeStageAligned = lifeStages.size <= 2;
  if (!lifeStageAligned) notes.push("Group spans many different life stages");

  // Personality trait overlap (5% weight)
  const allTraits = users.flatMap((u) => u.personalityTraits ?? []);
  const traitCounts = new Map<string, number>();
  allTraits.forEach((t) => traitCounts.set(t, (traitCounts.get(t) ?? 0) + 1));
  const sharedTraits = [...traitCounts.entries()]
    .filter(([, c]) => c >= 2)
    .map(([k]) => k);
  if (sharedTraits.length > 0) notes.push(`Shared traits: ${sharedTraits.join(", ")}`);

  // Scoring per spec weights:
  // 30% gender+city (hard requirements), 20% interests, 15% meetup, 15% energy, 10% conversation, 5% life stage, 5% personality
  const hardScore = ((genderOk ? 0.5 : 0) + (cityOk ? 0.5 : 0)) * 30;
  const interestScore = (interestOverlapPct / 100) * 20;
  const meetupScore = (meetupAligned ? 1 : 0.5) * 15;
  const energyScore = (energyBalance === "balanced" ? 1 : 0.5) * 15;
  const convScore = (convCompatible ? 1 : 0.5) * 10;
  const lifeStageScore = (lifeStageAligned ? 1 : 0.5) * 5;
  const traitScore = (sharedTraits.length > 0 ? 1 : 0.5) * 5;

  const overallScore = Math.round(
    hardScore + interestScore + meetupScore + energyScore + convScore + lifeStageScore + traitScore,
  );

  let label: CompatibilityReport["label"] = "weak";
  if (overallScore >= 85) label = "excellent";
  else if (overallScore >= 70) label = "good";
  else if (overallScore >= 55) label = "moderate";

  return {
    overallScore,
    label,
    genderOk,
    cityOk,
    sharedInterests,
    interestOverlapPct,
    energyBalance,
    energyNote,
    avgEnergyScore,
    convCompatible,
    convNote,
    warnings,
    notes,
    // Backward compat fields (availability removed from onboarding)
    commonDays: [],
    commonTimes: [],
    availabilityOk: true,
    lifestyleAligned: true,
    lifestyleNote: "",
    intentNote: "",
    boundaryNote: "",
  };
}
