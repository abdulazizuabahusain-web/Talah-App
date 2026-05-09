import { execSync } from "child_process";
import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

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
  let commit =
    process.env["REPLIT_GIT_COMMIT_SHA"] ??
    process.env["GIT_COMMIT"] ??
    "unknown";

  if (commit === "unknown") {
    try {
      commit = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    } catch {
      commit = "unknown";
    }
  }

  res.json({
    name: "talah-api",
    version: process.env["npm_package_version"] ?? "0.0.0",
    commit,
    nodeEnv: process.env["NODE_ENV"] ?? "development",
  });
});

export default router;
