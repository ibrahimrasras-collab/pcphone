import { Router } from "express";
import * as smsWebhook from "./sms.js";

const router = Router();

router.post("/incoming", smsWebhook.handleIncomingSms);
router.post("/status", smsWebhook.handleSmsStatus);

export default router;
