import twilio from "twilio";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

let client: twilio.Twilio | null = null;

function getClient(): twilio.Twilio {
  if (!client && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
    client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }
  return client!;
}

export interface OutboundCallOptions {
  to: string;
  from: string;
  statusCallback?: string;
}

export async function initiateOutboundCall(options: OutboundCallOptions) {
  const c = getClient();
  try {
    const call = await c.calls.create({
      to: options.to,
      from: options.from,
      url: `${env.CORS_ORIGIN}/webhooks/voice/outbound`,
      statusCallback: options.statusCallback,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    });
    logger.info({ callSid: call.sid, to: options.to }, "Outbound call initiated");
    return call;
  } catch (err) {
    logger.error({ err, to: options.to }, "Failed to initiate outbound call");
    throw err;
  }
}

export async function sendSms(to: string, from: string, body: string) {
  const c = getClient();
  try {
    const message = await c.messages.create({ to, from, body });
    logger.info({ messageSid: message.sid, to }, "SMS sent");
    return message;
  } catch (err) {
    logger.error({ err, to }, "Failed to send SMS");
    throw err;
  }
}

export async function purchaseNumber(areaCode?: string) {
  const c = getClient();
  const numbers = await c.availablePhoneNumbers("US").local.list({
    areaCode: areaCode ? parseInt(areaCode, 10) : undefined,
    limit: 1,
  });
  if (numbers.length === 0) {
    throw new Error("No available numbers found");
  }
  const number = await c.incomingPhoneNumbers.create({
    phoneNumber: numbers[0].phoneNumber,
  });
  return number;
}

export function validateWebhook(req: { headers: Record<string, string>; body: string }): boolean {
  if (!env.TWILIO_AUTH_TOKEN) return false;
  const signature = req.headers["x-twilio-signature"] || "";
  const url = req.headers["x-forwarded-proto"]
    ? `${req.headers["x-forwarded-proto"]}://${req.headers["host"]}${req.headers["x-original-url"] || ""}`
    : "";

  return twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, req.body as any);
}
