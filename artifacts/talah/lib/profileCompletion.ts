import type { User } from "./types";

export function computeProfileCompletion(user: User | null): number {
  if (!user) return 0;
  const checks = [
    !!user.nickname,
    !!user.city,
    !!user.gender,
    !!user.lifeStage,
    user.interests.length >= 3,
    !!user.preferredMeetup,
    !!user.socialEnergy,
    !!user.conversationStyle,
    (user.personalityTraits ?? []).length >= 1,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}
