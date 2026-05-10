import { z } from "zod";

const EnvironmentSchema = z.enum([
  "development",
  "test",
  "staging",
  "production",
]);

const REQUIRED_ENV_KEYS = [
  "NODE_ENV",
  "DATABASE_URL",
  "JWT_SECRET",
  "ADMIN_PIN_HASH",
  "EXPO_ACCESS_TOKEN",
  "PORT",
  "CORS_ORIGIN",
] as const;

type RequiredEnvKey = (typeof REQUIRED_ENV_KEYS)[number];
export type AppEnvironment = z.infer<typeof EnvironmentSchema>;

function readRequiredEnv(key: RequiredEnvKey): string {
  const value = process.env[key];
  if (!value?.trim()) {
    throw new Error(
      `${key} environment variable is required but was not provided.`,
    );
  }
  return value.trim();
}

function readOptionalEnv(key: string): string | undefined {
  const value = process.env[key];
  return value?.trim() ? value.trim() : undefined;
}

function parseNodeEnv(): AppEnvironment {
  const rawNodeEnv = readRequiredEnv("NODE_ENV");
  const parsed = EnvironmentSchema.safeParse(rawNodeEnv);
  if (!parsed.success) {
    throw new Error(
      `NODE_ENV must be one of ${EnvironmentSchema.options.join(", ")}; received "${rawNodeEnv}".`,
    );
  }
  return parsed.data;
}

function parsePort(rawPort: string): number {
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT must be a positive integer; received "${rawPort}".`);
  }
  return port;
}

function parseCorsOrigins(
  primaryOrigin: string,
  additionalOrigins?: string,
): string[] {
  return [primaryOrigin, ...(additionalOrigins?.split(",") ?? [])]
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const NODE_ENV = parseNodeEnv();
export const DATABASE_URL = readRequiredEnv("DATABASE_URL");
export const JWT_SECRET = readRequiredEnv("JWT_SECRET");
export const ADMIN_PIN_HASH = readRequiredEnv("ADMIN_PIN_HASH");
export const EXPO_ACCESS_TOKEN = readRequiredEnv("EXPO_ACCESS_TOKEN");
export const PORT = parsePort(readRequiredEnv("PORT"));
export const CORS_ORIGIN = readRequiredEnv("CORS_ORIGIN");

export const CORS_ORIGINS = parseCorsOrigins(
  CORS_ORIGIN,
  readOptionalEnv("CORS_ORIGINS"),
);
export const ADMIN_SESSION_SECRET = readOptionalEnv("ADMIN_SESSION_SECRET");
export const LOG_LEVEL = readOptionalEnv("LOG_LEVEL") ?? "info";
export const GITHUB_PAT = readOptionalEnv("GITHUB_PAT");
export const PAT_EXPIRES_AT = readOptionalEnv("PAT_EXPIRES_AT");
export const REPLIT_DEV_DOMAIN = readOptionalEnv("REPLIT_DEV_DOMAIN");
export const REPLIT_INTERNAL_APP_DOMAIN = readOptionalEnv(
  "REPLIT_INTERNAL_APP_DOMAIN",
);
export const EXPO_PUBLIC_DOMAIN = readOptionalEnv("EXPO_PUBLIC_DOMAIN");
export const REPLIT_GIT_COMMIT_SHA = readOptionalEnv("REPLIT_GIT_COMMIT_SHA");
export const GIT_COMMIT = readOptionalEnv("GIT_COMMIT");
export const APP_VERSION = readOptionalEnv("npm_package_version") ?? "0.0.0";

export const isProduction = NODE_ENV === "production";
export const isNonProduction = !isProduction;

export const environmentProfiles = ["staging", "production"] as const;
