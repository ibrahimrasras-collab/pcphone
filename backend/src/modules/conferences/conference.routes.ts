import { Router } from "express";
import * as c from "./conference.controller.js";
import { authenticate } from "../../middleware/auth.js";

// Webhook routes — no auth (called by Twilio)
const webhooks = Router();
webhooks.post("/join", c.joinConferenceWebhook);
webhooks.post("/wait-music", c.waitMusicWebhook);
webhooks.post("/status", c.conferenceStatusWebhook);

// API routes — authenticated
const api = Router();
api.use(authenticate);

api.post("/", c.createConference);
api.get("/", c.listConferences);
api.get("/:id", c.getConference);
api.post("/:id/end", c.endConference);

export default { webhooks, api };
