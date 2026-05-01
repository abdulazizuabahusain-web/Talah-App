import type { NextFunction, Request, Response } from "express";
import { getUserFromToken } from "../lib/auth";
import { isAdminToken } from "../lib/adminSessions";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers["authorization"];
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const row = await getUserFromToken(token);

  if (!row) {
    res.status(401).json({ error: "Session expired or invalid" });
    return;
  }

  req.user = row.user;
  req.session_token = token;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers["authorization"];
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Accept web dashboard admin tokens
  if (_isAdminToken && _isAdminToken(token)) {
    next();
    return;
  }

  // Fall back to regular user session with isAdmin flag
  const row = await getUserFromToken(token);
  if (!row) {
    res.status(401).json({ error: "Session expired or invalid" });
    return;
  }

  if (!row.user.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  req.user = row.user;
  req.session_token = token;
  next();
}
