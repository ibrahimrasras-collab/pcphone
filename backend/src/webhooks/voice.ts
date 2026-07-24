import { Request, Response } from "express";
import twilio from "twilio";
import { env } from "../config/env.js";
import { db } from "../db/index.js";
import { dids } from "../db/schema/dids.js";
import { users } from "../db/schema/users.js";
import { callRecords } from "../db/schema/call-records.js";
import { callForwarding } from "../db/schema/call-forwarding.js";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger.js";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function handleIncomingCall(req: Request, res: Response) {
  const twilioNumber = req.body.To;
  const callerNumber = req.body.From;
  const callSid = req.body.CallSid;

  logger.info({ twilioNumber, callerNumber, callSid }, "Inbound call");

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

  if (!user) {
    const twiml = new VoiceResponse();
    twiml.say("User not found. Goodbye.");
    twiml.hangup();
    return res.type("text/xml").send(twiml.toString());
  }

  const [forwarding] = await db
    .select()
    .from(callForwarding)
    .where(eq(callForwarding.userId, user.id));

  const twiml = new VoiceResponse();

  // Store CDR record
  await db.insert(callRecords).values({
    userId: user.id,
    twilioSid: callSid,
    direction: "inbound",
    fromNumber: callerNumber,
    toNumber: twilioNumber,
    status: "ringing",
  });

  // Check forwarding rules
  if (forwarding?.alwaysTo) {
    twiml.dial(forwarding.alwaysTo);
  } else {
    // Simulate ringing the user's WebRTC client
    // In production: send push notification, then dial the SIP client
    twiml.say("Connecting your call.");
    twiml.dial(
      { timeout: forwarding?.noAnswerRings ?? 15, action: "/webhooks/voice/no-answer" },
      twilioNumber,
    );
  }

  return res.type("text/xml").send(twiml.toString());
}

export async function handleStatusCallback(req: Request, res: Response) {
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;
  const duration = req.body.CallDuration;

  logger.info({ callSid, callStatus, duration }, "Call status update");

  await db
    .update(callRecords)
    .set({
      status: callStatus,
      durationSeconds: duration ? parseInt(duration, 10) : undefined,
      endedAt: callStatus === "completed" ? new Date() : undefined,
    })
    .where(eq(callRecords.twilioSid, callSid));

  return res.sendStatus(200);
}

export async function handleNoAnswer(req: Request, res: Response) {
  const callSid = req.body.CallSid;
  const twiml = new VoiceResponse();
  
  twiml.say("The person you are trying to reach is not available. Please leave a message after the tone.");
  twiml.record({
    action: "/webhooks/voice/voicemail",
    method: "POST",
    maxLength: 60,
    finishOnKey: "#",
  });

  return res.type("text/xml").send(twiml.toString());
}

export async function handleVoicemailRecording(req: Request, res: Response) {
  const callSid = req.body.CallSid;
  const recordingUrl = req.body.RecordingUrl;
  const recordingDuration = req.body.RecordingDuration;

  logger.info({ callSid, recordingUrl, recordingDuration }, "Voicemail recorded");

  // TODO: Store voicemail in database, trigger push notification

  const twiml = new VoiceResponse();
  twiml.say("Your message has been recorded. Goodbye.");
  twiml.hangup();

  return res.type("text/xml").send(twiml.toString());
}
