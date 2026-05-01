import { Router } from "express";
import { z } from "zod";
import { createOtp, deleteSession, verifyOtp } from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const SendOtpBody = z.object({ phone: z.string().min(9).max(15) });
const VerifyOtpBody = z.object({ phone: z.string(), code: z.string().length(4) });

router.post("/otp/send", async (req, res) => {
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

router.post("/otp/verify", async (req, res) => {
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

  res.json({ token });
});

router.post("/logout", requireAuth, async (req, res) => {
  await deleteSession(req.session_token!);
  res.json({ ok: true });
});

export default router;
