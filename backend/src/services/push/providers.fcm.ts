import https from "node:https";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import type { PushPayload } from "./push.service.js";

const FCM_URL = "https://fcm.googleapis.com/fcm/send";

export async function sendAndroidPush(
  deviceToken: string,
  payload: PushPayload,
): Promise<void> {
  if (!env.FCM_SERVER_KEY) {
    logger.warn("FCM server key not configured, skipping Android push");
    return;
  }

  const fcmPayload = {
    to: deviceToken,
    priority: "high",
    data: {
      callId: payload.callId,
      callerNumber: payload.callerNumber,
      callerName: payload.callerName ?? "",
      type: payload.type,
      title: "Incoming Call",
      body: payload.callerName
        ? `${payload.callerName} (${payload.callerNumber})`
        : payload.callerNumber,
      click_action: "CALL_INCOMING",
    },
    android: {
      priority: "high",
      notification: {
        title: "Incoming Call",
        body: payload.callerName
          ? `${payload.callerName} (${payload.callerNumber})`
          : payload.callerNumber,
        channel_id: "incoming_calls",
        priority: "max",
        sound: "ringtone",
        vibrate_timings_ms: "0,500,200,500",
        visibility: "public",
        tag: "call",
      },
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(
      FCM_URL,
      {
        method: "POST",
        headers: {
          "authorization": `key=${env.FCM_SERVER_KEY}`,
          "content-type": "application/json",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            logger.debug({ deviceToken }, "FCM push sent");
            resolve();
          } else {
            logger.error(
              { statusCode: res.statusCode, body, deviceToken },
              "FCM push failed",
            );
            reject(new Error(`FCM error: ${res.statusCode}`));
          }
        });
      },
    );
    req.on("error", reject);
    req.write(JSON.stringify(fcmPayload));
    req.end();
  });
}
