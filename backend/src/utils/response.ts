import { Response } from "express";

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
}

export function sendSuccess<T>(res: Response, data: T, meta?: PaginationMeta, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    error: null,
    meta: meta ?? null,
  });
}

export function sendError(res: Response, status: number, code: string, message: string, details?: unknown[]) {
  return res.status(status).json({
    success: false,
    data: null,
    error: { code, message, details: details ?? null },
  });
}
