import { db, pool, usersTable, requestsTable } from "@workspace/db";

const cities = ["Riyadh", "Jeddah", "Dammam", "Khobar", "Medina"];
const ageRanges = ["18-24", "25-29", "30-34", "35-44", "45+"];
const lifestyles = ["employee", "student", "parent", "entrepreneur", "other"];
const personalities = ["calm", "social", "curious", "active", "creative"];
const meetupTypes = ["coffee", "dinner"];
const times = ["morning", "afternoon", "evening"];
const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const interestPool = [
  "reading", "hiking", "cooking", "photography", "travel",
  "fitness", "art", "music", "gaming", "film",
  "tech", "design", "investing", "volunteering", "languages",
];

const socialEnergyOptions = ["introvert", "ambivert", "extrovert"];
const conversationStyleOptions = ["listener", "sharer", "balanced"];
const socialIntentOptions = ["deep_connections", "casual_friends", "networking", "open"];
const planningOptions = ["spontaneous", "planner", "flexible"];
const atmosphereOptions = ["cozy", "lively", "outdoors", "quiet"];
const interactionOptions = ["one_on_one", "small_group", "any"];
const opennessOptions = ["selective", "open", "very_open"];
const boundaryOptions = ["reserved", "moderate", "expressive"];
const traitPool = ["empathetic", "humorous", "ambitious", "creative", "analytical", "adventurous", "caring", "independent"];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany<T>(arr: readonly T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const womenNicknames = [
  "نورة", "سارة", "لمى", "ريم", "هند",
  "منى", "رهف", "دلال", "شيماء", "وفاء",
];
const menNicknames = [
  "فيصل", "خالد", "محمد", "عمر", "أحمد",
  "سلطان", "ناصر", "تركي", "يوسف", "بندر",
];
const funFacts = [
  "أجيد الطبخ الإيطالي أكثر من الإيطاليين أنفسهم",
  "أحفظ أكثر من 200 مقطع شعري",
  "زرت 15 دولة في سنة واحدة",
  "أستطيع القراءة بثلاث لغات",
  "أصنع قهوتي الخاصة يومياً منذ 5 سنوات",
  "درست الرسم لمدة عشر سنوات",
  "أمارس اليوغا كل فجر",
  "أعزف العود في أوقات الفراغ",
  "أهوى صيد السمك في البحر الأحمر",
  "كتبت رواية قصيرة لم أنشرها بعد",
];

function makeScores() {
  return {
    socialEnergyScore: 30 + Math.floor(Math.random() * 70),
    conversationDepthScore: 30 + Math.floor(Math.random() * 70),
    planningScore: 30 + Math.floor(Math.random() * 70),
    atmosphereScore: 30 + Math.floor(Math.random() * 70),
    interactionScore: 30 + Math.floor(Math.random() * 70),
    opennessScore: 30 + Math.floor(Math.random() * 70),
    boundaryScore: 30 + Math.floor(Math.random() * 70),
  };
}

function makeUser(index: number) {
  const gender = index % 2 === 0 ? "woman" : "man";
  const nickname = gender === "woman"
    ? womenNicknames[Math.floor(index / 2) % womenNicknames.length]
    : menNicknames[Math.floor(index / 2) % menNicknames.length];

  const city = pick(cities);

  return {
    phone: `+9665${String(10000000 + index).slice(0, 8)}`,
    email: `user${index}@talah-test.dev`,
    nickname,
    gender,
    city,
    ageRange: pick(ageRanges),
    lifestyle: pick(lifestyles),
    interests: pickMany(interestPool, 2, 5),
    personality: pick(personalities),
    preferredMeetup: pick(meetupTypes),
    preferredDays: pickMany(days, 2, 4),
    preferredTimes: pickMany(times, 1, 2),
    funFact: pick(funFacts),
    socialEnergy: pick(socialEnergyOptions),
    conversationStyle: pick(conversationStyleOptions),
    enjoyedTopics: pickMany(interestPool, 2, 4),
    socialIntent: pick(socialIntentOptions),
    planningPreference: pick(planningOptions),
    meetupAtmosphere: pick(atmosphereOptions),
    interactionPreference: pick(interactionOptions),
    personalityTraits: pickMany(traitPool, 2, 4),
    opennessLevel: pick(opennessOptions),
    socialBoundary: pick(boundaryOptions),
    ...makeScores(),
    onboarded: true,
    verified: true,
    flagged: false,
    isAdmin: false,
  };
}

const REQUEST_STATUSES = ["pending", "pending", "pending", "matched", "cancelled"] as const;

async function seed() {
  console.log("🌱 Seeding database...");

  const USER_COUNT = 20;
  const users = Array.from({ length: USER_COUNT }, (_, i) => makeUser(i));

  console.log(`  Inserting ${USER_COUNT} users...`);
  const inserted = await db
    .insert(usersTable)
    .values(users)
    .returning({ id: usersTable.id, nickname: usersTable.nickname, city: usersTable.city });

  console.log(`  ✓ ${inserted.length} users created`);

  // Give ~70% of users a meetup request
  const requestUsers = inserted.filter((_, i) => i % 3 !== 0);
  const requests = requestUsers.map((u) => ({
    userId: u.id,
    meetupType: pick(meetupTypes),
    preferredDate: pick(["friday", "saturday", "sunday"]),
    preferredTime: pick(times),
    area: u.city ?? pick(cities),
    status: pick(REQUEST_STATUSES),
  }));

  console.log(`  Inserting ${requests.length} meetup requests...`);
  await db.insert(requestsTable).values(requests);
  console.log(`  ✓ ${requests.length} requests created`);

  console.log("\nSample users:");
  inserted.slice(0, 5).forEach((u) => console.log(`  ${u.nickname} — ${u.city}`));

  console.log("\n✅ Seed complete!");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
