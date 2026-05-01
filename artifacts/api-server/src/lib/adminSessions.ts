import crypto from "crypto";

const sessions = new Map<string, number>(); // token -> expiresAt ms

export function createAdminToken(): string {
  const token = "adm-" + crypto.randomBytes(24).toString("hex");
  sessions.set(token, Date.now() + 8 * 60 * 60 * 1000); // 8 h
  return token;
}

export function isAdminToken(token: string): boolean {
  const exp = sessions.get(token);
  return !!exp && exp > Date.now();
}
