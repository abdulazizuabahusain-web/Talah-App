import express, { type Express } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import {
  CORS_ORIGINS,
  EXPO_PUBLIC_DOMAIN,
  isProduction,
  REPLIT_DEV_DOMAIN,
  REPLIT_INTERNAL_APP_DOMAIN,
} from "./lib/config";
import router from "./routes";
import { logger } from "./lib/logger";

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
const replitCorsOrigins = [
  REPLIT_DEV_DOMAIN,
  REPLIT_INTERNAL_APP_DOMAIN,
  EXPO_PUBLIC_DOMAIN,
]
  .filter(Boolean)
  .flatMap((domain) => {
    const host = domain!.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return [`https://${host}`, `http://${host}`];
  });

const allowedCorsOrigins = new Set([...CORS_ORIGINS, ...replitCorsOrigins]);

app.use(
  cors({
    origin(origin, callback) {
      if (!isProduction) {
        callback(null, true);
        return;
      }

      // Server-to-server/mobile requests may omit Origin; allow those while
      // restricting browser origins in production.
      if (!origin || allowedCorsOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS"));
    },
  }),
);
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

export default app;
