export async function sendSms(to: string, body: string): Promise<void> {
  if (!to) return;
  try {
    // Production SMS provider integration belongs here. Keeping this silent avoids
    // blocking account deletion if the provider is unavailable or not configured.
    void body;
  } catch {
    // Non-fatal by design.
  }
}
