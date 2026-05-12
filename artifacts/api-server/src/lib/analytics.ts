import crypto from "crypto";
import { createRequire } from "module";
import type { Request } from "express";
import { pool } from "@workspace/db";

const require = createRequire(import.meta.url);
const MIXPANEL_TOKEN = process.env["MIXPANEL_TOKEN"];

const PII_KEYS = new Set([
  "name",
  "fullName",
  "full_name",
  "nickname",
  "phone",
  "phoneNumber",
  "phone_number",
  "email",
  "deviceId",
  "device_id",
  "expoPushToken",
  "pushToken",
]);

let mixpanelClient: { track: (event: string, properties: Record<string, unknown>) => void } | null = null;

if (MIXPANEL_TOKEN) {
  try {
    const mixpanel = require("mixpanel") as { init: (token: string) => typeof mixpanelClient };
    mixpanelClient = mixpanel.init(MIXPANEL_TOKEN);
  } catch {
    mixpanelClient = null;
  }
}

export function anonymizeId(value: string): string {
  const salt = process.env["ANALYTICS_HASH_SALT"] ?? process.env["SESSION_SECRET"] ?? "talah-analytics";
  return crypto.createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export function hasAnalyticsConsent(req: Request): boolean {
  const header = req.get("x-analytics-consent")?.toLowerCase();
  return header === "accepted" || header === "true" || header === "1";
}

function sanitizeProperties(properties: Record<string, unknown> = {}): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (PII_KEYS.has(key)) continue;
    if (typeof value === "string") {
      const looksLikePhone = /^\+?\d[\d\s().-]{7,}$/.test(value);
      sanitized[key] = looksLikePhone ? "[redacted]" : value;
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

async function writeEvent(event: string, userId: string | null, properties: Record<string, unknown>): Promise<void> {
  try {
    await pool.query(
      `insert into events (event_name, user_id, properties) values ($1, $2, $3::jsonb)`,
      [event, userId, JSON.stringify(properties)],
    );
  } catch {
    // Analytics must never break product flows.
  }
}

export function track(event: string, userId?: string | null, properties: Record<string, unknown> = {}): void {
  try {
    const sanitized = sanitizeProperties(properties);
    void writeEvent(event, userId ?? null, sanitized);

    if (!mixpanelClient || !MIXPANEL_TOKEN) return;
    mixpanelClient.track(event, {
      distinct_id: userId ?? "anonymous",
      ...sanitized,
    });
  } catch {
    // Analytics errors are intentionally silent.
  }
}

export function trackIfConsented(
  req: Request,
  event: string,
  userId?: string | null,
  properties: Record<string, unknown> = {},
): void {
  if (!hasAnalyticsConsent(req)) return;
  track(event, userId, properties);
}
