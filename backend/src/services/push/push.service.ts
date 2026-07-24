import { db } from "../../db/index.js";
import { pushDevices } from "../../db/schema/push-devices.js";
import { eq, and } from "drizzle-orm";
import { logger } from "../../utils/logger.js";
import { sendIosPush, sendAndroidPush } from "../../services/push/providers.js";

export interface PushPayload {
  callId: string;
  callerNumber: string;
  callerName?: string;
  type: "incoming_call" | "voicemail" | "sms";
}

export async function registerDevice(params: {
  userId: string;
  platform: "ios" | "android";
  token: string;
  bundleId?: string;
}) {
  const existing = await db
    .select()
    .from(pushDevices)
    .where(eq(pushDevices.token, params.token));

  if (existing.length > 0) {
    const [updated] = await db
      .update(pushDevices)
      .set({
        userId: params.userId,
        platform: params.platform,
        bundleId: params.bundleId,
        updatedAt: new Date(),
      })
      .where(eq(pushDevices.token, params.token))
      .returning();
    return updated;
  }

  const [device] = await db
    .insert(pushDevices)
    .values({
      userId: params.userId,
      platform: params.platform,
      token: params.token,
      bundleId: params.bundleId,
    })
    .returning();

  return device;
}

export async function unregisterDevice(userId: string, token: string) {
  await db
    .delete(pushDevices)
    .where(and(eq(pushDevices.userId, userId), eq(pushDevices.token, token)));
}

export async function sendCallPush(userId: string, payload: PushPayload) {
  const devices = await db
    .select()
    .from(pushDevices)
    .where(eq(pushDevices.userId, userId));

  if (devices.length === 0) {
    logger.warn({ userId }, "No push devices registered for user");
    return { sent: 0 };
  }

  const results = await Promise.allSettled(
    devices.map((device) => {
      if (device.platform === "ios") {
        return sendIosPush(device.token, payload, device.bundleId);
      } else {
        return sendAndroidPush(device.token, payload);
      }
    }),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  logger.info({ userId, sent, failed }, "Push notifications sent");
  return { sent, failed };
}
