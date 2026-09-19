import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import bcrypt from "bcryptjs";
import express from "express";
import {
  adminAuditLogsTable,
  db,
  groupsTable,
  reportsTable,
  requestsTable,
  surveysTable,
  usersTable,
  venuesTable,
  waitlistSignupsTable,
} from "@workspace/db";

process.env["ADMIN_SESSION_SECRET"] = "admin-route-test-secret";
process.env["ADMIN_PIN_HASH"] = bcrypt.hashSync("2468", 4);
process.env["NODE_ENV"] = "test";

const { default: adminRouter } = await import("./admin.ts");

type DbTable = object;

const rowsByTable = new Map<DbTable, unknown[]>([
  [usersTable, [{ id: "user-1", nickname: "User source" }]],
  [requestsTable, [{ id: "request-1", userId: "user-1", status: "pending" }]],
  [groupsTable, [{ id: "group-1", city: "Riyadh" }]],
  [reportsTable, [{ id: "report-1", status: "open" }]],
  [venuesTable, [{ id: "venue-1", name: "Venue source" }]],
  [surveysTable, [{ id: "survey-1", nickname: "Survey source" }]],
  [adminAuditLogsTable, [{ id: "audit-1", action: "user.update" }]],
  [waitlistSignupsTable, [{ id: "waitlist-1", name: "Waitlist source" }]],
]);

const originalSelect = db.select;
const originalUpdate = db.update;
const originalExecute = db.execute;
let selectedTables: DbTable[] = [];
let executeCalls = 0;

function queryChain(selection?: Record<string, unknown>) {
  let table: DbTable | undefined;
  const chain = {
    from(value: DbTable) {
      table = value;
      selectedTables.push(value);
      return chain;
    },
    where() {
      return chain;
    },
    orderBy() {
      return chain;
    },
    limit() {
      return chain;
    },
    offset() {
      return chain;
    },
    leftJoin() {
      return chain;
    },
    set() {
      return chain;
    },
    then<TResult1 = unknown[], TResult2 = never>(
      resolve?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null,
      reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) {
      try {
        const rows =
          selection && "count" in selection
            ? [{ count: rowsByTable.get(table!)?.length ?? 0 }]
            : (rowsByTable.get(table!) ?? []);
        return Promise.resolve(rows).then(resolve, reject);
      } catch (error) {
        return Promise.reject(error).then(resolve, reject);
      }
    },
  };
  return chain;
}

before(() => {
  db.select = ((selection?: Record<string, unknown>) =>
    queryChain(selection)) as typeof db.select;
  db.update = (() => queryChain()) as typeof db.update;
  db.execute = (async () => {
    executeCalls += 1;
    return {
      rows: [{ date: "2026-09-19", count: 3 }],
    };
  }) as typeof db.execute;
});

after(() => {
  db.select = originalSelect;
  db.update = originalUpdate;
  db.execute = originalExecute;
});

const app = express();
app.use(express.json());
app.use("/api/admin", adminRouter);

const server = app.listen(0);
await new Promise<void>((resolve) => server.once("listening", resolve));
after(() => server.close());

const address = server.address();
assert(address && typeof address === "object");
const baseUrl = `http://127.0.0.1:${address.port}/api/admin`;

async function getJson(path: string, token: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(response.status, 200, `GET ${path} should succeed`);
  return response.json() as Promise<unknown>;
}

let adminToken = "";

test("admin login produces a reusable token", async () => {
  const response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pin: "2468" }),
  });
  assert.equal(response.status, 200);

  const body = (await response.json()) as { token?: string };
  assert.match(body.token ?? "", /^adm\./);
  adminToken = body.token!;

  const firstUse = await getJson("/me", adminToken);
  const secondUse = await getJson("/me", adminToken);
  assert.deepEqual(firstUse, { ok: true });
  assert.deepEqual(secondUse, { ok: true });
});

test("main dashboard tabs use their expected data sources and response shapes", async () => {
  const cases = [
    {
      path: "/users",
      table: usersTable,
      expected: { data: rowsByTable.get(usersTable), total: 1, hasMore: false },
    },
    {
      path: "/requests",
      table: requestsTable,
      expected: {
        data: [{ ...(rowsByTable.get(requestsTable)![0] as object), invitation: null }],
        total: 1,
        hasMore: false,
      },
    },
    {
      path: "/groups",
      table: groupsTable,
      expected: { data: rowsByTable.get(groupsTable), total: 1, hasMore: false },
    },
    { path: "/reports", table: reportsTable, expected: rowsByTable.get(reportsTable) },
    { path: "/venues", table: venuesTable, expected: rowsByTable.get(venuesTable) },
    { path: "/surveys", table: surveysTable, expected: rowsByTable.get(surveysTable) },
    {
      path: "/audit-logs",
      table: adminAuditLogsTable,
      expected: {
        data: rowsByTable.get(adminAuditLogsTable),
        total: 1,
        hasMore: false,
      },
    },
  ];

  for (const route of cases) {
    selectedTables = [];
    const body = await getJson(route.path, adminToken);
    assert.deepEqual(body, route.expected, `${route.path} response shape changed`);
    assert(
      selectedTables.includes(route.table),
      `${route.path} queried the wrong data source`,
    );
  }
});

test("waitlist search and growth remain distinct and work independently", async () => {
  selectedTables = [];
  executeCalls = 0;
  const waitlist = await getJson("/waitlist?q=Waitlist", adminToken);
  assert.deepEqual(waitlist, {
    data: rowsByTable.get(waitlistSignupsTable),
    total: 1,
  });
  assert(selectedTables.includes(waitlistSignupsTable));
  assert.equal(executeCalls, 0, "waitlist search must not run the growth query");

  selectedTables = [];
  const growth = await getJson("/analytics/waitlist-growth?days=7", adminToken);
  assert.deepEqual(growth, [{ date: "2026-09-19", count: 3 }]);
  assert.equal(executeCalls, 1);
  assert.equal(
    selectedTables.includes(waitlistSignupsTable),
    false,
    "growth must not run the waitlist search query",
  );
});