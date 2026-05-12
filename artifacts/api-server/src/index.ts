import app from "./app";
import { cleanupExpiredAuthRows } from "./lib/auth";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

if (!process.env["PAT_EXPIRES_AT"]) {
  logger.warn(
    "PAT_EXPIRES_AT env var is not set — GitHub PAT expiry tracking will not work correctly. " +
      "Set PAT_EXPIRES_AT=YYYY-MM-DD in the Replit Secrets panel to the date your GitHub PAT expires.",
  );
}

void cleanupExpiredAuthRows().catch((err) => {
  logger.warn({ err }, "Expired auth row cleanup failed at startup");
});

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
