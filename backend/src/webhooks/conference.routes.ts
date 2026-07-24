import { Router } from "express";
import confRoutes from "../modules/conferences/conference.routes.js";

const router = Router();

// Conference webhooks (called by Twilio)
router.use("/webhooks/conferences", confRoutes.webhooks);

export default router;
