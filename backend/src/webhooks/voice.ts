import { Request, Response } from "express";
import twilio from "twilio";
import { env } from "../config/env.js";
import { db } from "../db/index.js";
import { dids } from "../db/schema/dids.js";
import { users } from "../db/schema/users.js";
import { callRecords } from "../db/schema/call-records.js";
import { callForwarding } from "../db/schema/call-forwarding.js";
import { voicemailSettings } from "../db/schema/voicemail-settings.js";
import { voicemailMessages } from "../db/schema/voicemail-messages.js";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger.js";
import { sendCallPush } from "../services/push/push.service.js";
import { randomUUID } from "node:crypto";

const VoiceResponse = twilio.twiml.VoiceResponse;

const VOICEMAIL_GREETING_DEFAULT = "The person you are trying to reach is not available. Please leave a message after the tone.";
const VOICEMAIL_MAX_LENGTH_SEC = 120;
const VOICEMAIL_BEEP = true;

export async function handleIncomingCall(req: Request, res: Response) {
  const twilioNumber = req.body.To;
  const callerNumber = req.body.From;
  const callerName = req.body.CallerName as string | undefined;
  const callSid = req.body.CallSid;

  logger.info({ twilioNumber, callerNumber, callerName, callSid }, "Inbound call");

  const [did] = await db
    .select()
    .from(dids)
    .where(eq(dids.phoneNumber, twilioNumber));

  if (!did || !did.assignedTo) {
    const twiml = new VoiceResponse();
    twiml.say("The number you dialed is not assigned. Goodbye.");
    twiml.hangup();
    return res.type("text/xml").send(twiml.toString());
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, did.assignedTo));

  if (!user?.isActive) {
    const twiml = new VoiceResponse();
    twiml.say("This account is unavailable. Goodbye.");
    twiml.hangup();
    return res.type("text/xml").send(twiml.toString());
  }

  const [forwarding] = await db
    .select()
    .from(callForwarding)
    .where(eq(callForwarding.userId, user.id));

  const [voicemail] = await db
    .select()
    .from(voicemailSettings)
    .where(eq(voicemailSettings.userId, user.id));

  const callId = randomUUID();
  await db.insert(callRecords).values({
    id: callId,
    userId: user.id,
    twilioSid: callSid,
    direction: "inbound",
    fromNumber: callerNumber,
    toNumber: twilioNumber,
    status: "ringing",
  });

  // Send push notification asynchronously (does not block TwiML response)
  sendCallPush(user.id, {
    callId,
    callerNumber,
    callerName,
    type: "incoming_call",
  }).catch((err) => logger.error({ err }, "Push notification failed"));

  const twiml = new VoiceResponse();

  // === Routing decision tree ===
  if (forwarding?.alwaysTo) {
    // Always-forward rule: route to external number
    logger.info({ userId: user.id, target: forwarding.alwaysTo }, "Forwarding call (always)");
    twiml.dial({
      timeout: forwarding.noAnswerRings ?? 20,
      action: buildActionUrl("/webhooks/voice/dial-status", { callId, userId: user.id, voicemailEnabled: voicemail?.greetingType !== "none" }),
      method: "POST",
    }, forwarding.alwaysTo);
  } else {
    // Ring the user's WebRTC/SIP client with a fallback to voicemail on no-answer
    const dialTimeout = forwarding?.noAnswerRings ?? 20;
    const voicemailEnabled = voicemail?.greetingType !== "none";

    logger.info({ userId: user.id, dialTimeout, voicemailEnabled }, "Ringing user extension");

    // In a full production system: dial the user's SIP/WebRTC client identity here
    // e.g., twiml.dial({ timeout }, `sip:${user.id}@pcphone.sip.twilio.com`)
    // For now: simulate ringing + voicemail fallback
    twiml.dial({
      timeout: dialTimeout,
      action: buildActionUrl("/webhooks/voice/dial-status", { callId, userId: user.id, voicemailEnabled }),
      method: "POST",
      hangupOnStar: false,
    }, `client:pcphone-user-${user.id}`);
  }

  return res.type("text/xml").send(twiml.toString());
}

/**
 * Handle dial status callback from <Dial>.
 * Fires when the dial completes (answered, no-answer, busy, failed).
 * Routes to voicemail only if the dial did NOT result in a successful connection.
 */
export async function handleDialStatus(req: Request, res: Response) {
  const callSid = req.body.CallSid;
  const dialCallStatus = req.body.DialCallStatus as string | undefined;
  const dialCallDuration = req.body.DialCallDuration as string | undefined;
  const callId = req.query.callId as string;
  const userId = req.query.userId as string;
  const voicemailEnabled = req.query.voicemailEnabled === "true";

  logger.info({ callSid, dialCallStatus, dialCallDuration, callId }, "Dial status callback");

  // Update CDR with the dial result
  const answeredStatuses = ["completed", "in-progress", "answered"];
  const wasAnswered = dialCallStatus ? answeredStatuses.includes(dialCallStatus) : false;

  await db
    .update(callRecords)
    .set({
      status: wasAnswered ? "completed" : "no-answer",
      durationSeconds: dialCallDuration ? parseInt(dialCallDuration, 10) : 0,
      endedAt: wasAnswered ? new Date() : undefined,
    })
    .where(eq(callRecords.id, callId));

  const twiml = new VoiceResponse();

  // Only route to voicemail if the call was NOT answered AND voicemail is enabled
  if (wasAnswered || !voicemailEnabled) {
    logger.info({ callId, wasAnswered }, "Call resolved — no voicemail needed");
    twiml.hangup();
    return res.type("text/xml").send(twiml.toString());
  }

  // Fetch user's voicemail greeting settings
  const [settings] = await db
    .select()
    .from(voicemailSettings)
    .where(eq(voicemailSettings.userId, userId));

  // Play greeting
  if (settings?.greetingType === "custom" && settings.greetingUrl) {
    twiml.play(settings.greetingUrl);
  } else if (settings?.greetingType === "none") {
    // No greeting — go straight to beep
    logger.info({ userId }, "Voicemail greeting disabled, recording with beep only");
  } else {
    twiml.say(VOICEMAIL_GREETING_DEFAULT);
  }

  // Record voicemail
  twiml.record({
    action: buildActionUrl("/webhooks/voice/voicemail", { callId, userId: userId }),
    method: "POST",
    maxLength: VOICEMAIL_MAX_LENGTH_SEC,
    finishOnKey: "#",
    playBeep: VOICEMAIL_BEEP,
    transcribe: settings?.transcription ?? true,
    transcribeCallback: buildActionUrl("/webhooks/voice/transcription", { callId, userId }),
  });

  return res.type("text/xml").send(twiml.toString());
}

/**
 * Handle voicemail recording callback.
 * This fires after the caller finishes recording (hangs up, hits #, or hits max length).
 */
export async function handleVoicemailRecording(req: Request, res: Response) {
  const callSid = req.body.CallSid;
  const recordingUrl = req.body.RecordingUrl as string;
  const recordingDuration = req.body.RecordingDuration as string;
  const recordingSid = req.body.RecordingSid as string;
  const userId = req.query.userId as string;
  const callId = req.query.callId as string;
  const fromNumber = req.body.From as string;
  const callerName = req.body.CallerName as string | undefined;

  const durationSec = recordingDuration ? parseInt(recordingDuration, 10) : 0;

  logger.info({ callSid, recordingUrl, recordingSid, durationSec, userId }, "Voicemail recorded");

  // Reject empty recordings (caller hung up before recording)
  if (!recordingUrl || durationSec === 0) {
    logger.info({ callSid }, "Empty voicemail — skipping storage");
    const twiml = new VoiceResponse();
    twiml.say("Goodbye.");
    twiml.hangup();
    return res.type("text/xml").send(twiml.toString());
  }

  // Persist voicemail in database
  const [voicemail] = await db
    .insert(voicemailMessages)
    .values({
      userId,
      callerNumber: fromNumber,
      callerName: callerName ?? null,
      durationSeconds: durationSec,
      audioUrl: recordingUrl,
      transcription: null, // Set by transcription webhook
      isRead: false,
    })
    .returning();

  logger.info({ voicemailId: voicemail.id, userId }, "Voicemail stored in DB");

  // Send push notification to user about new voicemail
  sendCallPush(userId, {
    callId,
    callerNumber: fromNumber,
    callerName,
    type: "voicemail",
  }).catch((err) => logger.error({ err }, "Voicemail push failed"));

  // Email notification (optional)
  const [settings] = await db
    .select()
    .from(voicemailSettings)
    .where(eq(voicemailSettings.userId, userId));

  if (settings?.emailNotify && settings.emailAddress) {
    // TODO: send email via SES/SendGrid — out of scope for this pass
    logger.info({ userId, email: settings.emailAddress }, "Voicemail email notification queued");
  }

  // Update CDR to mark that a voicemail was left
  await db
    .update(callRecords)
    .set({ status: "completed", endedAt: new Date() })
    .where(eq(callRecords.id, callId));

  const twiml = new VoiceResponse();
  twiml.say("Your message has been recorded. Goodbye.");
  twiml.hangup();

  return res.type("text/xml").send(twiml.toString());
}

/**
 * Handle voicemail transcription callback.
 * Twilio calls this asynchronously when transcription completes.
 */
export async function handleTranscription(req: Request, res: Response) {
  const transcriptionText = req.body.TranscriptionText as string;
  const recordingSid = req.body.RecordingSid as string;
  const recordingUrl = req.body.RecordingUrl as string;
  const userId = req.query.userId as string;
  const transcriptionStatus = req.body.TranscriptionStatus as string;

  logger.info({ recordingSid, transcriptionStatus, userId }, "Voicemail transcription received");

  if (transcriptionStatus !== "completed" || !transcriptionText) {
    logger.warn({ recordingSid }, "Transcription failed or empty");
    return res.sendStatus(200);
  }

  // Update the voicemail message with the transcription
  await db
    .update(voicemailMessages)
    .set({ transcription: transcriptionText })
    .where(eq(voicemailMessages.audioUrl, recordingUrl));

  logger.info({ recordingSid, userId }, "Voicemail transcription stored");

  return res.sendStatus(200);
}

/**
 * Handle the legacy no-answer endpoint (now routed through dial-status).
 * Kept for backward compatibility with existing Twilio configurations.
 */
export async function handleNoAnswer(req: Request, res: Response) {
  return handleDialStatus(req, res);
}

/**
 * Build an absolute URL for Twilio callbacks.
 * Twilio requires absolute action URLs.
 */
function buildActionUrl(path: string, params: Record<string, string>): string {
  const base = (env.PUBLIC_URL as string) ?? `http://localhost:${env.PORT}`;
  const qs = new URLSearchParams(params).toString();
  return `${base}${path}${qs ? `?${qs}` : ""}`;
}
