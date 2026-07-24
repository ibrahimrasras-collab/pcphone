import { Router } from "express";
import * as admin from "./admin.controller.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = Router();

// All admin routes require authentication AND admin role
router.use(authenticate);
router.use(authorize("admin"));

// User management
router.get("/users", admin.listUsers);
router.get("/users/:id", admin.getUser);
router.put("/users/:id", admin.updateUser);

// DID management
router.get("/dids", admin.listDids);
router.post("/dids/assign", admin.assignDid);
router.post("/dids/unassign/:id", admin.unassignDid);

// System
router.get("/system/stats", admin.systemStats);
router.get("/system/recent-calls", admin.recentCalls);

export default router;
