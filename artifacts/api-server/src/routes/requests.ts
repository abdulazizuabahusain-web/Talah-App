import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db, requestsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const CreateRequestBody = z.object({
  meetupType: z.enum(["coffee", "dinner"]),
  preferredDate: z.string(),
  preferredTime: z.enum(["morning", "afternoon", "evening"]),
  area: z.string().min(1),
});

router.get("/", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.userId, req.user!.id))
    .orderBy(requestsTable.createdAt);
  res.json(rows);
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = CreateRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request data" });
    return;
  }

  const existing = await db
    .select()
    .from(requestsTable)
    .where(
      and(
        eq(requestsTable.userId, req.user!.id),
        eq(requestsTable.status, "pending"),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "You already have a pending request" });
    return;
  }

  const [created] = await db
    .insert(requestsTable)
    .values({ ...parsed.data, userId: req.user!.id })
    .returning();

  res.status(201).json(created);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const [row] = await db
    .select()
    .from(requestsTable)
    .where(
      and(
        eq(requestsTable.id, req.params["id"]!),
        eq(requestsTable.userId, req.user!.id),
      ),
    )
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (row.status !== "pending") {
    res.status(400).json({ error: "Only pending requests can be cancelled" });
    return;
  }

  await db
    .update(requestsTable)
    .set({ status: "cancelled" })
    .where(eq(requestsTable.id, row.id));

  res.json({ ok: true });
});

export default router;
