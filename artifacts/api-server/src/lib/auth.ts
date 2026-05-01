import crypto from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { db, otpTable, sessionsTable, usersTable } from "@workspace/db";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createOtp(phone: string): Promise<string> {
  const code = process.env["NODE_ENV"] === "production"
    ? String(Math.floor(100000 + Math.random() * 900000))
    : "0000";

  await db.delete(otpTable).where(eq(otpTable.phone, phone));

  await db.insert(otpTable).values({
    phone,
    code,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  return code;
}

export async function verifyOtp(phone: string, code: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(otpTable)
    .where(
      and(
        eq(otpTable.phone, phone),
        eq(otpTable.code, code),
        gt(otpTable.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) return null;

  await db.delete(otpTable).where(eq(otpTable.phone, phone));

  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phone, phone))
    .limit(1);

  if (!user) {
    [user] = await db
      .insert(usersTable)
      .values({ phone })
      .returning();
  }

  const token = crypto.randomBytes(32).toString("hex");

  await db.insert(sessionsTable).values({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });

  return token;
}

export async function getUserFromToken(token: string) {
  const [row] = await db
    .select({ session: sessionsTable, user: usersTable })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
    .where(
      and(
        eq(sessionsTable.token, token),
        gt(sessionsTable.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function deleteSession(token: string) {
  await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
}
