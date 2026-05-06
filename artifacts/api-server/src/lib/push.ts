/**
 * Expo Push Notifications — thin wrapper around the Expo HTTP Push API.
 * No SDK dependency required; uses plain fetch.
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  to: string; // Expo push token, e.g. "ExponentPushToken[...]"
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
}

export async function sendPush(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  // Expo accepts batches of up to 100 messages
  const chunks: PushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(chunk),
      });
    } catch {
      // Non-fatal: push delivery failure should never block the request
    }
  }
}

/**
 * Convenience: send the same notification to multiple tokens.
 * Silently skips null/empty tokens.
 */
export async function sendPushToMany(
  tokens: (string | null | undefined)[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const messages: PushMessage[] = tokens
    .filter((t): t is string => !!t && t.startsWith("ExponentPushToken"))
    .map((to) => ({ to, title, body, data, sound: "default" as const }));
  await sendPush(messages);
}
