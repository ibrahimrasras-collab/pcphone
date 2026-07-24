import { Router } from "express";
import * as pushController from "./push.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.post("/register", authenticate, pushController.registerDevice);
router.post("/unregister", authenticate, pushController.unregisterDevice);

export default router;
