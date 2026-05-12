import { and, eq, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db, groupsTable, requestsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { trackIfConsented } from "../lib/analytics";

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

  // Attach groupId by checking which group (if any) contains each request in its requestIds array.
  // requestsTable has no groupId column — the link is stored on the group side.
  const enriched = await Promise.all(
    rows.map(async (r) => {
      const [group] = await db
        .select({ id: groupsTable.id })
        .from(groupsTable)
        .where(sql`${r.id} = ANY(${groupsTable.requestIds})`)
        .limit(1);
      return { ...r, groupId: group?.id ?? null };
    }),
  );

  res.json(enriched);
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

  trackIfConsented(req, "group_requested", req.user!.id, {
    type: parsed.data.meetupType,
    city: req.user!.city,
  });

  res.status(201).json(created);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const [row] = await db
    .select()
    .from(requestsTable)
    .where(
      and(
        eq(requestsTable.id, req.params["id"] as string),
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

  // If this request was part of a group, remove it from the group's membership arrays.
  // If the group drops below 3 members, revert it to "cancelled".
  const [group] = await db
    .select()
    .from(groupsTable)
    .where(sql`${row.id} = ANY(${groupsTable.requestIds})`)
    .limit(1);

  if (group) {
    const updatedMembers = group.memberIds.filter((id) => id !== req.user!.id);
    const updatedRequests = group.requestIds.filter((id) => id !== row.id);
    const newStatus = updatedMembers.length < 3 ? "cancelled" : group.status;
    await db
      .update(groupsTable)
      .set({
        memberIds: updatedMembers,
        requestIds: updatedRequests,
        status: newStatus,
      })
      .where(eq(groupsTable.id, group.id));
  }

  res.json({ ok: true });
});

export default router;
