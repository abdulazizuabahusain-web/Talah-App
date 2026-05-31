---
name: Zod import rule
description: Which zod import path to use in which package
---

- In `api-server` (esbuild bundle): import from `"zod"` (not `"zod/v4"`)
- In `lib/db` schema files: import from `"zod/v4"` via drizzle-zod

**Why:** esbuild resolves `"zod/v4"` incorrectly in the bundle, causing runtime errors. The api-server runs the bundled output so it must use the stable `"zod"` path.
