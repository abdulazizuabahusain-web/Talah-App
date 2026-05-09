import crypto from "crypto";
import { and, eq, gt, lt, or } from "drizzle-orm";
import { db, otpTable, sessionsTable, usersTable } from "@workspace/db";

const LOGIN_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createLoginCodeValue(): string {
  return process.env["NODE_ENV"] === "production"
    ? String(Math.floor(100000 + Math.random() * 900000))
    : "0000";
}

export async function createEmailLoginCode(email: string): Promise<string> {
  const normalizedEmail = normalizeEmail(email);
  const code = createLoginCodeValue();

  // The historical OTP table column is named `phone`; it now stores the login
  // identifier for code-based auth. Email is the active identifier for new users.
  await db.delete(otpTable).where(eq(otpTable.phone, normalizedEmail));

  await db.insert(otpTable).values({
    phone: normalizedEmail,
    code,
    expiresAt: new Date(Date.now() + LOGIN_CODE_TTL_MS),
  });

  return code;
}

export async function verifyEmailLoginCode(
  email: string,
  code: string,
): Promise<string | null> {
  const normalizedEmail = normalizeEmail(email);
  const [row] = await db
    .select()
    .from(otpTable)
    .where(
      and(
        eq(otpTable.phone, normalizedEmail),
        eq(otpTable.code, code),
        gt(otpTable.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) return null;

  await db.delete(otpTable).where(eq(otpTable.phone, normalizedEmail));

  let [user] = await db
    .select()
    .from(usersTable)
    .where(
      or(
        eq(usersTable.email, normalizedEmail),
        // Backward-compatible lookup for users created before the email column
        // existed or for transitional records where phone mirrors email.
        eq(usersTable.phone, normalizedEmail),
      ),
    )
    .limit(1);

  if (!user) {
    [user] = await db
      .insert(usersTable)
      .values({ email: normalizedEmail, phone: normalizedEmail })
      .returning();
  } else if (!user.email) {
    [user] = await db
      .update(usersTable)
      .set({ email: normalizedEmail })
      .where(eq(usersTable.id, user.id))
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

// Backward-compatible aliases for old mobile builds that still call OTP routes.
export const createOtp = createEmailLoginCode;
export const verifyOtp = verifyEmailLoginCode;

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

export async function cleanupExpiredAuthRows() {
  const now = new Date();
  await Promise.all([
    db.delete(otpTable).where(lt(otpTable.expiresAt, now)),
    db.delete(sessionsTable).where(lt(sessionsTable.expiresAt, now)),
  ]);
}
