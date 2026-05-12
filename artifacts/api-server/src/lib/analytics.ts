import Mixpanel from "mixpanel";
import { logger } from "./logger";

let client: ReturnType<typeof Mixpanel.init> | null = null;

const token = process.env["MIXPANEL_TOKEN"];
if (token) {
  client = Mixpanel.init(token, { protocol: "https" });
  logger.info("Mixpanel analytics initialised");
} else {
  logger.warn("MIXPANEL_TOKEN not set — analytics disabled");
}

const STRIPPED_KEYS = ["phone", "email", "name", "deviceId", "ip"];

function sanitize(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (!STRIPPED_KEYS.includes(k)) out[k] = v;
  }
  return out;
}

export function track(
  event: string,
  userId: string,
  properties: Record<string, unknown> = {},
): void {
  if (!client) return;
  try {
    client.track(event, {
      distinct_id: userId,
      ...sanitize(properties),
    });
  } catch (err) {
    logger.warn({ err, event }, "Mixpanel track error (silent)");
  }
}
