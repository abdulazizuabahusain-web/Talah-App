import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db, venuesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// GET /venues — list active venues for the mobile request form
// Query: city (optional), type (coffee|dinner|both) (optional)
router.get("/", requireAuth, async (req, res) => {
  const city = typeof req.query["city"] === "string" ? req.query["city"].trim() : "";
  const type = typeof req.query["type"] === "string" ? req.query["type"].trim() : "";

  const conditions = [eq(venuesTable.active, true)];

  if (city) {
    conditions.push(ilike(venuesTable.city, city));
  }

  if (type && type !== "both") {
    // Match venues that serve this type OR are 'both'
    conditions.push(
      or(eq(venuesTable.type, type), eq(venuesTable.type, "both")) as ReturnType<typeof eq>,
    );
  }

  const rows = await db
    .select()
    .from(venuesTable)
    .where(and(...conditions))
    .orderBy(asc(venuesTable.name));

  res.json(rows);
});

export default router;
