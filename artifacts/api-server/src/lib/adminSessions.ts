import crypto from "crypto";

const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 h
const TOKEN_PREFIX = "adm";

function getAdminSessionSecret(): string {
  const secret =
    process.env["ADMIN_SESSION_SECRET"] ?? process.env["ADMIN_PIN_HASH"];

  if (secret) return secret;

  if (process.env["NODE_ENV"] === "production") {
    throw new Error(
      "ADMIN_SESSION_SECRET or ADMIN_PIN_HASH must be set in production.",
    );
  }

  return "dev-admin-session-secret";
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", getAdminSessionSecret())
    .update(payload)
    .digest("base64url");
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  return (
    aBuffer.length === bBuffer.length &&
    crypto.timingSafeEqual(aBuffer, bBuffer)
  );
}

export function createAdminToken(): string {
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  const nonce = crypto.randomBytes(16).toString("base64url");
  const payload = `${expiresAt}.${nonce}`;

  return `${TOKEN_PREFIX}.${payload}.${sign(payload)}`;
}

export function isAdminToken(token: string): boolean {
  const [prefix, expiresAtRaw, nonce, signature, ...extra] = token.split(".");

  if (
    prefix !== TOKEN_PREFIX ||
    !expiresAtRaw ||
    !nonce ||
    !signature ||
    extra.length > 0
  ) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const expected = sign(`${expiresAtRaw}.${nonce}`);
  return timingSafeEqual(signature, expected);
}
