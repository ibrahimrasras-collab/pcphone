import { Request, Response } from "express";
import { logger } from "../utils/logger.js";

export async function handleIncomingSms(req: Request, res: Response) {
  const from = req.body.From;
  const to = req.body.To;
  const body = req.body.Body;
  const messageSid = req.body.MessageSid;

  logger.info({ from, to, body, messageSid }, "Inbound SMS");

  // TODO: Store message in conversations/messages tables
  // TODO: Send push notification to user

  return res.sendStatus(200);
}

export async function handleSmsStatus(req: Request, res: Response) {
  const messageSid = req.body.MessageSid;
  const status = req.body.MessageStatus;

  logger.info({ messageSid, status }, "SMS status update");

  // TODO: Update message status in database

  return res.sendStatus(200);
}
