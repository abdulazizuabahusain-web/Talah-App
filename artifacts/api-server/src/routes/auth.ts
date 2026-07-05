import crypto from "crypto";
import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import {
  createEmailLoginCode,
  deleteSession,
  getUserFromToken,
  normalizeEmail,
  verifyEmailLoginCode,
} from "../lib/auth";
import { track } from "../lib/analytics";
import { sendLoginCodeEmail } from "../lib/email";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const codeSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login code requests — please wait 15 minutes" },
});

const codeVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification attempts — please wait 15 minutes" },
});

const SendEmailCodeBody = z.object({ email: z.string().email() });
const VerifyEmailCodeBody = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(6),
});

async function sendEmailCode(req: Request, res: Response) {
  const parsed = SendEmailCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  const email = normalizeEmail(parsed.data.email);
  const code = await createEmailLoginCode(email);

  if (process.env["NODE_ENV"] !== "production") {
    req.log.info({ email, code }, "Email login code created (dev mode)");
  } else {
    try {
      await sendLoginCodeEmail(email, code);
    } catch (err) {
      req.log.error({ err, email }, "Failed to send login code email");
      res.status(502).json({ error: "Failed to send login code email. Please try again." });
      return;
    }
  }

  // Anonymise the email into a one-way hash so no PII is sent to analytics
  const anonId = crypto.createHash("sha256").update(email).digest("hex").slice(0, 16);
  track("otp_requested", anonId, {});

  // In dev, return the code directly so Replit previews remain easy to test
  // without needing to check a real inbox.
  res.json({
    ok: true,
    ...(process.env["NODE_ENV"] !== "production" ? { code } : {}),
  });
}

async function verifyEmailCode(req: Request, res: Response) {
  const parsed = VerifyEmailCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const token = await verifyEmailLoginCode(parsed.data.email, parsed.data.code);
  if (!token) {
    res.status(401).json({ error: "Invalid or expired login code" });
    return;
  }

  const row = await getUserFromToken(token);
  if (!row) {
    res.status(500).json({ error: "Session creation failed" });
    return;
  }

  track("otp_verified", row.user.id, { city: row.user.city ?? undefined });
  res.json({ token, user: row.user });
}

router.post("/email/send", codeSendLimiter, sendEmailCode);
router.post("/email/verify", codeVerifyLimiter, verifyEmailCode);

// Compatibility aliases. Existing clients can keep using /otp/* while the UI
// transitions copy and payloads to email-based sign-in.
router.post("/otp/send", codeSendLimiter, sendEmailCode);
router.post("/otp/verify", codeVerifyLimiter, verifyEmailCode);

router.post("/logout", requireAuth, async (req, res) => {
  await deleteSession(req.session_token!);
  res.json({ ok: true });
});

export default router;