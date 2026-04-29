import type { User } from "./types";

export function computeProfileCompletion(user: User | null): number {
  if (!user) return 0;
  const checks = [
    !!user.nickname,
    !!user.city,
    !!user.gender,
    !!user.ageRange,
    !!user.lifestyle,
    user.interests.length >= 3,
    !!user.personality,
    !!user.preferredMeetup,
    user.preferredDays.length > 0,
    user.preferredTimes.length > 0,
    !!user.funFact,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}
