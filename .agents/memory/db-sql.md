---
name: DB SQL execution
description: How to run raw SQL against the database safely in this workspace
---

To run raw SQL (migrations, seed, one-off queries):
```bash
cd lib/db && node -e "
const { Pool } = require('./node_modules/pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('...').then(r => { console.log(r.rows); pool.end(); });
"
```

**Why:** `pnpm run push` is interactive and blocks in non-TTY contexts. Direct node execution is reliable in shell.

**How to apply:** Never use `pnpm run push` in automated steps. Use the node snippet above for schema migrations or data changes.
