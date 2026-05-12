import * as Sentry from "@sentry/node";
import { logger } from "./logger";

export function initSentry(): void {
  const dsn = process.env["SENTRY_DSN"];
  if (!dsn) {
    logger.warn("SENTRY_DSN not set — error tracking disabled");
    return;
  }
  Sentry.init({
    dsn,
    environment: process.env["NODE_ENV"] ?? "development",
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
  });
  logger.info("Sentry error tracking initialised");
}

export { Sentry };
