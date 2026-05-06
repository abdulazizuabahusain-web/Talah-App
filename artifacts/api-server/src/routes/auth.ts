import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { createOtp, verifyOtp, deleteSession, getUserFromToken } from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// 5 OTP send requests per phone-derived IP per 15 min — prevents SMS flooding
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many OTP requests — please wait 15 minutes" },
});

// 10 verify attempts per IP per 15 min — prevents brute-force of 4-digit codes
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification attempts — please wait 15 minutes" },
});

const SendOtpBody = z.object({ phone: z.string().min(9).max(15) });
const VerifyOtpBody = z.object({ phone: z.string(), code: z.string().length(4) });

router.post("/otp/send", otpSendLimiter, async (req, res) => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid phone number" });
    return;
  }

  const code = await createOtp(parsed.data.phone);

  if (process.env["NODE_ENV"] !== "production") {
    req.log.info({ code }, "OTP created (dev mode)");
  }

  res.json({ ok: true, ...(process.env["NODE_ENV"] !== "production" ? { code } : {}) });
});

router.post("/otp/verify", otpVerifyLimiter, async (req, res) => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const token = await verifyOtp(parsed.data.phone, parsed.data.code);
  if (!token) {
    res.status(401).json({ error: "Invalid or expired OTP" });
    return;
  }

  const row = await getUserFromToken(token);
  if (!row) {
    res.status(500).json({ error: "Session creation failed" });
    return;
  }

  res.json({ token, user: row.user });
});

router.post("/logout", requireAuth, async (req, res) => {
  await deleteSession(req.session_token!);
  res.json({ ok: true });
});

export default router;
