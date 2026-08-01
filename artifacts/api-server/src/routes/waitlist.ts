import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db, waitlistSignupsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router = Router();

const waitlistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many waitlist submissions — please try again later" },
});

const bodySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .max(30, "Phone too long")
    .regex(/^[+\d\s\-().]{5,30}$/, "Invalid phone number"),
});

router.post("/waitlist", waitlistLimiter, async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    });
    return;
  }

  const { name, phone } = parsed.data;

  try {
    await db.insert(waitlistSignupsTable).values({ name, phone });
    req.log.info({ phone }, "Waitlist signup");
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to insert waitlist signup");
    res.status(500).json({ ok: false, error: "Server error — please try again" });
  }
});

export default router;
