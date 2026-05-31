---
name: seed.ts pick() readonly arrays
description: pick() and pickMany() must accept readonly arrays to work with as-const arrays
---

`function pick<T>(arr: readonly T[]): T` — the `readonly` modifier is required.

**Why:** TypeScript `as const` creates `readonly` tuples. Without `readonly` on the parameter, TypeScript infers `unknown` for the return type and rejects the call.

**How to apply:** Any utility that accepts and indexes an array passed from an `as const` source must use `readonly T[]`.
