import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { airwallexWebhook } from "./routes/billing";

const app: Express = express();
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required.");
}
app.disable("x-powered-by");
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  next();
});

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
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  airwallexWebhook,
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET));
app.use("/api", (req, res, next) => {
  if (req.method !== "POST") {
    next();
    return;
  }

  const origin = req.header("origin");
  const fetchSite = req.header("sec-fetch-site");
  const expectedOrigin = `${req.protocol}://${req.get("host")}`;
  const sameSiteRequest = fetchSite === "same-origin";
  if (origin !== expectedOrigin && !sameSiteRequest) {
    res.status(403).json({ message: "Requests must come from this site." });
    return;
  }
  next();
});

app.use("/api", router);

app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  req.log.error({ err: error }, "request failed");
  const message = error instanceof Error ? error.message : "Unexpected server error";
  const status = message.includes("Insufficient permissions") ? 403 : 502;
  res.status(status).json({
    message: status === 403
      ? "The Airwallex API key needs Payment Acceptance write permission."
      : "The billing provider could not complete this request.",
  });
});

export default app;
