import assert from "node:assert/strict";
import test from "node:test";

process.env["ADMIN_SESSION_SECRET"] = "test-secret";
process.env["NODE_ENV"] = "test";

const { createAdminToken, isAdminToken } = await import("./adminSessions.ts");

test("admin tokens are signed and accepted before expiry", () => {
  const token = createAdminToken();

  assert.match(token, /^adm\.\d+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  assert.equal(isAdminToken(token), true);
});

test("admin tokens reject tampered signatures", () => {
  const token = createAdminToken();
  const parts = token.split(".");
  parts[3] = "tampered";

  assert.equal(isAdminToken(parts.join(".")), false);
});

test("admin tokens reject expired payloads", () => {
  const token = createAdminToken();
  const parts = token.split(".");
  parts[1] = String(Date.now() - 1000);

  assert.equal(isAdminToken(parts.join(".")), false);
});
