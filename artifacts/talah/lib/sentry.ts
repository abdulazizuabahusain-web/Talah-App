import type React from "react";

let sentry: { init?: (options: Record<string, unknown>) => void; wrap?: <T>(component: T) => T } | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  sentry = require("@sentry/react-native");
} catch {
  sentry = null;
}

export function initSentry(dsn?: string): void {
  if (!dsn) return;
  try {
    sentry?.init?.({
      dsn,
      tracesSampleRate: 0.2,
      environment: process.env["NODE_ENV"],
    });
  } catch {
    // Sentry is optional in local/dev builds.
  }
}

export function wrapWithSentry<T extends React.ComponentType<unknown>>(component: T): T {
  try {
    return sentry?.wrap?.(component) ?? component;
  } catch {
    return component;
  }
}
