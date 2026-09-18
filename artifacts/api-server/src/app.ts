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
