import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { logger } from "./utils/logger.js";
import authRoutes from "./modules/auth/auth.routes.js";
import pushRoutes from "./modules/push/push.routes.js";
import voicemailRoutes from "./modules/voicemail/voicemail.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import conferenceApiRoutes from "./modules/conferences/conference.routes.js";
import voiceWebhooks from "./webhooks/voice.routes.js";
import smsWebhooks from "./webhooks/sms.routes.js";
import conferenceWebhooks from "./webhooks/conference.routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/push", pushRoutes);
app.use("/api/v1/voicemail", voicemailRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/conferences", conferenceApiRoutes.api);
app.use("/webhooks", conferenceWebhooks);
app.use("/webhooks/voice", voiceWebhooks);
app.use("/webhooks/sms", smsWebhooks);

app.use(errorHandler);

export default app;
