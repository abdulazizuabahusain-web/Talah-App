import { Resend } from "resend";
import { logger } from "./logger";

const FROM_ADDRESS = process.env["EMAIL_FROM"] || "Tal'ah <info@talahapp.com>";

let cachedClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = new Resend(apiKey);
  }
  return cachedClient;
}

export async function sendLoginCodeEmail(email: string, code: string): Promise<void> {
  const client = getResendClient();

  if (!client) {
    if (process.env["NODE_ENV"] === "production") {
      logger.error(
        "RESEND_API_KEY is not set — cannot send login code email in production",
      );
    }
    return;
  }

  const { error } = await client.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: `${code} is your Tal'ah login code`,
    text: `Your Tal'ah login code is: ${code}\n\nThis code expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `<p>Your Tal'ah login code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p><p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  });

  if (error) {
    logger.error({ err: error, email }, "Failed to send login code email via Resend");
    throw new Error(`Failed to send login code email: ${error.message}`);
  }
}
