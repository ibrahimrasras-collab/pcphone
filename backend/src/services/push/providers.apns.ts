import https from "node:https";
import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import type { PushPayload } from "./push.service.js";

const APPLE_PUSH_URL = env.NODE_ENV === "production"
  ? "https://api.push.apple.com"
  : "https://api.sandbox.push.apple.com";

export async function sendIosPush(
  deviceToken: string,
  payload: PushPayload,
  bundleId?: string,
): Promise<void> {
  if (!env.APNS_KEY_ID || !env.APNS_TEAM_ID) {
    logger.warn("APNs not configured, skipping iOS push");
    return;
  }

  const topic = bundleId ?? "com.pcphone.app";
  const jwtToken = signApnsJwt();

  const apnsPayload = {
    aps: {
      "alert": {
        "title": payload.type === "incoming_call" ? "Incoming Call" : "PCPhone",
        "body": payload.callerName
          ? `${payload.callerName} (${payload.callerNumber})`
          : payload.callerNumber,
      },
      "sound": "ringtone.caf",
      "category": "CALL_INCOMING",
      "thread-id": "calls",
      "interruption-level": "time-sensitive",
    },
    callId: payload.callId,
    callerNumber: payload.callerNumber,
    callerName: payload.callerName,
    type: payload.type,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(
      `${APPLE_PUSH_URL}/3/device/${deviceToken}`,
      {
        method: "POST",
        headers: {
          "authorization": `bearer ${jwtToken}`,
          "apns-topic": `${topic}.voip`,
          "apns-push-type": "voip",
          "apns-priority": "10",
          "apns-expiration": "0",
          "content-type": "application/json",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            logger.debug({ deviceToken }, "APNs push sent");
            resolve();
          } else {
            logger.error(
              { statusCode: res.statusCode, body, deviceToken },
              "APNs push failed",
            );
            reject(new Error(`APNs error: ${res.statusCode}`));
          }
        });
      },
    );
    req.on("error", reject);
    req.write(JSON.stringify(apnsPayload));
    req.end();
  });
}

function signApnsJwt(): string {
  const header = { alg: "ES256", kid: env.APNS_KEY_ID, typ: "JWT" };
  const payload = {
    iss: env.APNS_TEAM_ID,
    iat: Math.floor(Date.now() / 1000),
  };
  // In production, sign with the .p8 private key using crypto
  // For now, return a placeholder — configure with real key in production
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  // Note: The actual signing requires the .p8 ECDSA key
  // This would use crypto.createSign("SHA256").update(signingInput).sign(p8Key)
  throw new Error("APNs signing not implemented — add .p8 key path to env");
}
