import crypto from "crypto";
import type { Request } from "express";
import { adminAuditLogsTable, db } from "@workspace/db";

function getActorTokenHash(req: Request): string | null {
  const header = req.headers["authorization"];
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  return token ? crypto.createHash("sha256").update(token).digest("hex") : null;
}

export async function writeAdminAuditLog(
  req: Request,
  input: {
    action: string;
    targetTable: string;
    targetId?: string | null;
    before?: unknown;
    after?: unknown;
  },
) {
  try {
    await db.insert(adminAuditLogsTable).values({
      actorTokenHash: getActorTokenHash(req),
      action: input.action,
      targetTable: input.targetTable,
      targetId: input.targetId ?? null,
      before: input.before ?? null,
      after: input.after ?? null,
    });
  } catch (err) {
    req.log.warn(
      { err, auditAction: input.action },
      "Admin audit log write failed",
    );
  }
}
