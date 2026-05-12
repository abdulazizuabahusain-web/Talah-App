import { Platform } from "react-native";

const ALLOWED_EVENTS = new Set(["screen_view", "app_opened", "app_backgrounded", "notification_tapped"]);
let consentAccepted = false;
let client: { init?: () => Promise<void> | void; track: (event: string, properties?: Record<string, unknown>) => Promise<void> | void } | null = null;
let initialized = false;

function getToken(): string | undefined {
  return process.env["EXPO_PUBLIC_MIXPANEL_TOKEN"];
}

function getClient() {
  if (client || !getToken()) return client;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("mixpanel-react-native") as { Mixpanel?: new (token: string, trackAutomaticEvents?: boolean) => typeof client };
    if (mod.Mixpanel) client = new mod.Mixpanel(getToken()!, false);
  } catch {
    client = null;
  }
  return client;
}

async function ensureInitialized() {
  if (initialized) return;
  const mixpanel = getClient();
  if (!mixpanel) return;
  await mixpanel.init?.();
  initialized = true;
}

export function setAnalyticsConsent(accepted: boolean): void {
  consentAccepted = accepted;
}

export function hasAnalyticsConsent(): boolean {
  return consentAccepted;
}

export async function track(event: string, _userId?: string | null, properties: Record<string, unknown> = {}): Promise<void> {
  try {
    if (!consentAccepted || !ALLOWED_EVENTS.has(event)) return;
    const mixpanel = getClient();
    if (!mixpanel) return;
    await ensureInitialized();
    await mixpanel.track(event, {
      ...properties,
      platform: Platform.OS,
    });
  } catch {
    // Analytics must stay silent when declined, unconfigured, or unavailable.
  }
}
