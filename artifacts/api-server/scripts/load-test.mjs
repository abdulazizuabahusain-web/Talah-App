#!/usr/bin/env node

import autocannon from "autocannon";

const DEFAULT_BASE_URL = "http://localhost:3000";
const CONNECTIONS = 50;
const DURATION_SECONDS = 30;
const P99_THRESHOLD_MS = 2000;

const baseUrl = (process.env.LOAD_TEST_BASE_URL ?? DEFAULT_BASE_URL).replace(
  /\/$/,
  "",
);
const bearerToken = process.env.LOAD_TEST_AUTH_TOKEN;
const loginEmail = process.env.LOAD_TEST_EMAIL ?? "load-test@example.com";
const loginCode = process.env.LOAD_TEST_CODE ?? "0000";

const endpoints = [
  {
    name: "Send OTP",
    method: "POST",
    path: "/api/auth/otp/send",
    body: { email: loginEmail },
  },
  {
    name: "Verify OTP",
    method: "POST",
    path: "/api/auth/otp/verify",
    body: { email: loginEmail, code: loginCode },
  },
  {
    name: "List groups",
    method: "GET",
    path: "/api/groups",
  },
  {
    name: "Current user",
    method: "GET",
    path: "/api/users/me",
    headers: bearerToken
      ? { authorization: `Bearer ${bearerToken}` }
      : undefined,
  },
];

function formatNumber(value, fractionDigits = 0) {
  if (!Number.isFinite(value)) return "n/a";
  return value.toFixed(fractionDigits);
}

async function runEndpoint(endpoint) {
  const headers = {
    ...(endpoint.body ? { "content-type": "application/json" } : {}),
    ...(endpoint.headers ?? {}),
  };

  return autocannon({
    url: `${baseUrl}${endpoint.path}`,
    method: endpoint.method,
    connections: CONNECTIONS,
    duration: DURATION_SECONDS,
    headers,
    body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
  });
}

function printResults(rows) {
  console.log(`\nLoad test target: ${baseUrl}`);
  console.log(
    `Connections: ${CONNECTIONS}; duration: ${DURATION_SECONDS}s per endpoint; p99 threshold: ${P99_THRESHOLD_MS}ms\n`,
  );
  console.table(
    rows.map((row) => ({
      endpoint: `${row.method} ${row.path}`,
      "req/sec": formatNumber(row.requests.average, 2),
      "latency p50 (ms)": formatNumber(row.latency.p50, 2),
      "latency p99 (ms)": formatNumber(row.latency.p99, 2),
      errors: row.errors,
    })),
  );
}

const rows = [];
for (const endpoint of endpoints) {
  console.log(
    `Running ${endpoint.method} ${endpoint.path} for ${DURATION_SECONDS}s...`,
  );
  const result = await runEndpoint(endpoint);
  rows.push({
    ...endpoint,
    requests: result.requests,
    latency: result.latency,
    errors: result.errors ?? 0,
  });
}

printResults(rows);

const failures = rows.filter(
  (row) => row.latency.p99 > P99_THRESHOLD_MS || row.errors > 0,
);

if (failures.length > 0) {
  console.error("\nLoad test failed thresholds:");
  for (const row of failures) {
    if (row.latency.p99 > P99_THRESHOLD_MS) {
      console.error(
        `- ${row.method} ${row.path} p99 latency ${formatNumber(row.latency.p99, 2)}ms exceeded ${P99_THRESHOLD_MS}ms`,
      );
    }
    if (row.errors > 0) {
      console.error(
        `- ${row.method} ${row.path} reported ${row.errors} errors`,
      );
    }
  }
  process.exit(1);
}
