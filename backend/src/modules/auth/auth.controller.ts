import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service.js";
import { registerSchema, loginSchema, refreshSchema } from "./auth.schema.js";
import { sendSuccess } from "../../utils/response.js";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    return sendSuccess(res, result, undefined, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const deviceInfo = req.headers["user-agent"] || undefined;
    const ipAddress = req.ip;
    const result = await authService.login(input, deviceInfo, ipAddress);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const input = refreshSchema.parse(req.body);
    const result = await authService.refresh(input.refreshToken);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    return sendSuccess(res, { message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getUser(req.user!.sub);
    return sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}
