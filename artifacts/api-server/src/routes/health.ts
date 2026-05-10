import { execSync } from "child_process";
import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import {
  APP_VERSION,
  GIT_COMMIT,
  NODE_ENV,
  REPLIT_GIT_COMMIT_SHA,
} from "../lib/config";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

router.get("/readyz", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({ status: "ready", database: "ok" });
  } catch {
    res.status(503).json({ status: "not_ready", database: "error" });
  }
});

router.get("/version", (_req, res) => {
  let commit = REPLIT_GIT_COMMIT_SHA ?? GIT_COMMIT ?? "unknown";

  if (commit === "unknown") {
    try {
      commit = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    } catch {
      commit = "unknown";
    }
  }

  res.json({
    name: "talah-api",
    version: APP_VERSION,
    commit,
    nodeEnv: NODE_ENV,
  });
});

export default router;
