import express, { type Express } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { initSentry, Sentry } from "./lib/sentry";

initSentry();

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.set("trust proxy", 1); // Replit proxy sets X-Forwarded-For
const configuredCorsOrigins = (process.env["CORS_ORIGINS"] ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const replitCorsOrigins = [
  process.env["REPLIT_DEV_DOMAIN"],
  process.env["REPLIT_INTERNAL_APP_DOMAIN"],
  process.env["EXPO_PUBLIC_DOMAIN"],
]
  .filter(Boolean)
  .flatMap((domain) => {
    const host = domain!.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return [`https://${host}`, `http://${host}`];
  });

// Hardcoded production origins that are always permitted regardless of
// environment variables.
const hardcodedCorsOrigins = [
  "https://talahapp.com",
  "https://www.talahapp.com",
  "https://mobile-first-web--abdulazizuabahu.replit.app",
];

const allowedCorsOrigins = new Set([
  ...hardcodedCorsOrigins,
  ...configuredCorsOrigins,
  ...replitCorsOrigins,
]);

app.use(
  cors({
    origin(origin, callback) {
      if (process.env["NODE_ENV"] !== "production") {
        callback(null, true);
        return;
      }
      // Server-to-server/mobile requests may omit Origin; allow those while
      // restricting browser origins in production.
      callback(null, !origin || allowedCorsOrigins.has(origin));
    },
  }),
);

// Return a clean 403 JSON response for disallowed browser origins.
// This runs after the cors middleware (which sets no headers for rejected
// origins) so the browser also sees the CORS block, but avoids the
// unhandled-error path that previously produced a 500 HTML body.
app.use((req, res, next) => {
  const origin = req.headers["origin"];
  if (
    process.env["NODE_ENV"] === "production" &&
    origin &&
    !allowedCorsOrigins.has(origin)
  ) {
    res.status(403).json({ ok: false, error: "Origin not allowed" });
    return;
  }
  next();
});
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));

// Global rate limit — 100 requests per IP per 15 min across all /api routes.
// Stricter per-route limits are applied on auth and admin login endpoints.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Rate limit exceeded — please slow down" },
  }),
);

app.use("/api", router);

// Sentry error handler must be after all routes and before any other error middleware
Sentry.setupExpressErrorHandler(app);

export default app;