import { createRequire } from "module";
import type { Express, ErrorRequestHandler, RequestHandler } from "express";

const require = createRequire(import.meta.url);
const SENTRY_DSN = process.env["SENTRY_DSN"];

let sentry: {
  init?: (options: Record<string, unknown>) => void;
  expressIntegration?: () => unknown;
  handlers?: { requestHandler?: () => RequestHandler; errorHandler?: () => ErrorRequestHandler };
  setupExpressErrorHandler?: (app: Express) => void;
} | null = null;
let profilingIntegration: (() => unknown) | null = null;

if (SENTRY_DSN) {
  try {
    sentry = require("@sentry/node");
    const profiling = require("@sentry/profiling-node") as { nodeProfilingIntegration?: () => unknown };
    profilingIntegration = profiling.nodeProfilingIntegration ?? null;
    sentry?.init?.({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.2,
      profilesSampleRate: 0.1,
      environment: process.env["NODE_ENV"],
      integrations: [
        ...(sentry.expressIntegration ? [sentry.expressIntegration()] : []),
        ...(profilingIntegration ? [profilingIntegration()] : []),
      ],
    });
  } catch {
    sentry = null;
  }
}

export function sentryRequestHandler(): RequestHandler | null {
  try {
    return sentry?.handlers?.requestHandler?.() ?? null;
  } catch {
    return null;
  }
}

export function installSentryErrorHandler(app: Express): boolean {
  try {
    if (!sentry) return false;
    if (sentry.setupExpressErrorHandler) {
      sentry.setupExpressErrorHandler(app);
      return true;
    }
    const handler = sentry.handlers?.errorHandler?.();
    if (handler) {
      app.use(handler);
      return true;
    }
  } catch {
    // Sentry must not prevent boot.
  }
  return false;
}
