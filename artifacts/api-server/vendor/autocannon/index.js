import { performance } from "node:perf_hooks";

function percentile(values, percent) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((percent / 100) * sorted.length) - 1,
  );
  return sorted[index];
}

export default async function autocannon(options) {
  const durationMs = (options.duration ?? 10) * 1000;
  const connections = options.connections ?? 10;
  const deadline = performance.now() + durationMs;
  const latencies = [];
  let completed = 0;
  let errors = 0;

  async function worker() {
    while (performance.now() < deadline) {
      const startedAt = performance.now();
      try {
        const response = await fetch(options.url, {
          method: options.method ?? "GET",
          headers: options.headers,
          body: options.body,
        });
        await response.arrayBuffer();
      } catch {
        errors += 1;
      } finally {
        completed += 1;
        latencies.push(performance.now() - startedAt);
      }
    }
  }

  await Promise.all(Array.from({ length: connections }, () => worker()));

  return {
    errors,
    requests: {
      average: completed / (durationMs / 1000),
      total: completed,
    },
    latency: {
      p50: percentile(latencies, 50),
      p99: percentile(latencies, 99),
    },
  };
}
