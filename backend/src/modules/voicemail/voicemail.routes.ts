import { Router } from "express";
import * as v from "./voicemail.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", v.listVoicemails);
router.get("/:id", v.getVoicemail);
router.put("/:id/read", v.markAsRead);
router.delete("/:id", v.deleteVoicemail);

export default router;
