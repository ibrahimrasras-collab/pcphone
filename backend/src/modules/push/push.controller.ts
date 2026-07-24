import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as pushService from "../../services/push/push.service.js";
import { sendSuccess } from "../../utils/response.js";
import { authenticate } from "../../middleware/auth.js";

const registerSchema = z.object({
  platform: z.enum(["ios", "android"]),
  token: z.string().min(1),
  bundleId: z.string().optional(),
});

export async function registerDevice(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const device = await pushService.registerDevice({
      userId: req.user!.sub,
      platform: input.platform,
      token: input.token,
      bundleId: input.bundleId,
    });
    return sendSuccess(res, { device }, undefined, 201);
  } catch (err) {
    next(err);
  }
}

export async function unregisterDevice(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;
    await pushService.unregisterDevice(req.user!.sub, token);
    return sendSuccess(res, { message: "Device unregistered" });
  } catch (err) {
    next(err);
  }
}
