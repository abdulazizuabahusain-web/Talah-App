---
name: artifact.toml production env var placement
description: Where production PORT/env vars must live in artifact.toml for run-type services to actually be injected at deploy time
---

For a `run`-type production service in `.replit-artifact/artifact.toml`, env vars (e.g. `PORT`, `BASE_PATH`) must be declared under `[services.<name>.production.run.env]`, nested inside the `run` table alongside `args`. A top-level `[services.env]` block is not injected into the production run process for `run`-type services.

**Why:** A mobile artifact's custom `server/serve.js` had `PORT`/`BASE_PATH` declared in a top-level `[services.env]` block. The build succeeded but the deploy promote step failed — the deployer's port scanner never saw the expected port open. The process was alive the whole time; `process.env.PORT` was empty, so the app silently bound to its hardcoded fallback port instead of the port the deployer was probing for, and got SIGTERM'd after the ~60s port-detection timeout. Comparing against a working sibling service (API server, `serve = run` via `node dist/index.mjs`) showed its env vars were correctly nested under `[services.production.run.env]`, not top-level.

**How to apply:** When debugging a deploy where the build phase succeeds but promote/port-detection fails for a custom `run` command service, check that `PORT` (and any other required env var) is declared under `[services.<name>.production.run.env]`, not a top-level `[services.env]` block. `serve = "static"` services are unaffected since they don't run a process that reads `PORT`.
