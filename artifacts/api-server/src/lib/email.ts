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

export async function sendWaitlistConfirmationEmail(
  toEmail: string,
  name: string,
): Promise<void> {
  const client = getResendClient();

  if (!client) {
    if (process.env["NODE_ENV"] === "production") {
      logger.error(
        "RESEND_API_KEY is not set — cannot send waitlist confirmation email in production",
      );
    }
    return;
  }

  const { error } = await client.emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: "أنتِ على قائمة انتظار طلعة 🎉",
    text: `أهلاً ${name}،\n\nشكراً لانضمامكِ لقائمة انتظار طلعة! ستكونين من أوائل من يعرفن حين نفتح أبوابنا.\n\nفريق طلعة`,
    html: `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f4ef;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ef;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:#3d4a2e;padding:32px 40px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#c8a84b;letter-spacing:2px;">طلعة</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px;letter-spacing:4px;">TAL'AH</div>
        </td></tr>
        <tr><td style="padding:36px 40px;text-align:right;">
          <p style="font-size:22px;font-weight:700;color:#2c2c2c;margin:0 0 12px;">أهلاً ${name} 👋</p>
          <p style="font-size:16px;color:#555;line-height:1.8;margin:0 0 20px;">
            شكراً لانضمامكِ لقائمة انتظار <strong style="color:#3d4a2e;">طلعة</strong>!<br>
            ستكونين من أوائل من يعرفن حين نفتح أبوابنا.
          </p>
          <div style="background:#f7f4ef;border-radius:12px;padding:16px 20px;margin:24px 0;">
            <p style="margin:0;font-size:14px;color:#7a7060;line-height:1.7;">
              طلعة تُرتّب لكِ لقاء مع أشخاص يشاركونكِ الاهتمامات، في مجموعة صغيرة، في مكان مريح، بدون أي إحراج.
            </p>
          </div>
          <p style="font-size:14px;color:#a89c86;margin:24px 0 0;">فريق طلعة</p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #f0ebe2;text-align:center;">
          <p style="font-size:12px;color:#bbb;margin:0;">© 2026 Tal'ah · <a href="https://talahapp.com" style="color:#bbb;">talahapp.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) {
    logger.error({ err: error, email: toEmail }, "Failed to send waitlist confirmation email");
    // Do not throw — confirmation email failure must not block the signup response
  }
}
