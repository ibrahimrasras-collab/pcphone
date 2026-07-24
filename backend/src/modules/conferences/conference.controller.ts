import { Request, Response } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import { conferences } from "../../db/schema/conferences.js";
import { NotFoundError, ValidationError } from "../../utils/errors.js";
import { sendSuccess } from "../../utils/response.js";
import { env } from "../../config/env.js";
import twilio from "twilio";
import { randomUUID } from "node:crypto";
import { logger } from "../../utils/logger.js";

const VoiceResponse = twilio.twiml.VoiceResponse;

const createSchema = z.object({
  friendlyName: z.string().min(1).max(255).optional(),
  pin: z.string().min(4).max(12).optional(),
  maxParticipants: z.number().min(2).max(250).default(10),
  record: z.boolean().default(false),
  muteOnJoin: z.boolean().default(false),
});

const joinSchema = z.object({
  pin: z.string().optional(),
});

// ===== API endpoints =====

export async function createConference(req: Request, res: Response) {
  const input = createSchema.parse(req.body);

  // Generate unique room name (Twilio conference names must be unique)
  const roomName = `conf-${randomUUID().slice(0, 8)}`;

  const [conf] = await db
    .insert(conferences)
    .values({
      userId: req.user!.sub,
      roomName,
      friendlyName: input.friendlyName ?? roomName,
      pin: input.pin,
      maxParticipants: input.maxParticipants,
      record: input.record,
      muteOnJoin: input.muteOnJoin,
      status: "created",
      isActive: false,
    })
    .returning();

  return sendSuccess(res, conf, undefined, 201);
}

export async function listConferences(req: Request, res: Response) {
  const rows = await db
    .select()
    .from(conferences)
    .where(eq(conferences.userId, req.user!.sub));

  return sendSuccess(res, rows);
}

export async function getConference(req: Request, res: Response) {
  const [conf] = await db
    .select()
    .from(conferences)
    .where(eq(conferences.id, req.params.id));

  if (!conf || conf.userId !== req.user!.sub) {
    throw new NotFoundError("Conference not found");
  }

  return sendSuccess(res, conf);
}

export async function endConference(req: Request, res: Response) {
  const [conf] = await db
    .select()
    .from(conferences)
    .where(eq(conferences.id, req.params.id));

  if (!conf || conf.userId !== req.user!.sub) {
    throw new NotFoundError("Conference not found");
  }

  // Tell Twilio to end the conference via API (kicks all participants)
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    try {
      await client.conferences(conf.roomName).update({ status: "completed" });
    } catch (err) {
      console.error("Failed to end Twilio conference:", err);
    }
  }

  const [updated] = await db
    .update(conferences)
    .set({ status: "completed", isActive: false, endedAt: new Date() })
    .where(eq(conferences.id, conf.id))
    .returning();

  return sendSuccess(res, updated);
}

// ===== Twilio webhook: dial-in to conference =====

export async function joinConferenceWebhook(req: Request, res: Response) {
  const fromNumber = req.body.From as string;
  const confId = req.query.id as string;
  const enteredPin = (req.body.Digits || req.query.pin) as string | undefined;

  const [conf] = await db
    .select()
    .from(conferences)
    .where(eq(conferences.id, confId));

  if (!conf || !conf.isActive) {
    const twiml = new VoiceResponse();
    twiml.say("The conference you are trying to join is not active. Goodbye.");
    twiml.hangup();
    return res.type("text/xml").send(twiml.toString());
  }

  // PIN check
  if (conf.pin && conf.pin !== enteredPin) {
    const twiml = new VoiceResponse();
    twiml.say("Please enter the conference PIN followed by the pound key.");
    twiml.gather({
      action: buildUrl(`/webhooks/conferences/join?id=${confId}`),
      method: "POST",
      numDigits: conf.pin.length,
      finishOnKey: "#",
    });
    return res.type("text/xml").send(twiml.toString());
  }

  const twiml = new VoiceResponse();
  const dial = twiml.dial();

  // Join as a participant — Twilio handles all mixing
  dial.conference({
    name: conf.roomName,
    maxParticipants: conf.maxParticipants ?? 10,
    record: conf.record ? "record-from-start-dual-channel" : "do-not-record",
    muted: conf.muteOnJoin ?? false,
    beep: true,
    waitMethod: "POST",
    waitUrl: buildUrl("/webhooks/conferences/wait-music"),
    startConferenceOnEnter: !conf.muteOnJoin,  // First moderator starts it
    endConferenceOnExit: false,                // Only manual end via API
    statusCallback: buildUrl(`/webhooks/conferences/status?id=${confId}`),
    statusCallbackMethod: "POST",
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
  });

  logger.info({ confId, fromNumber }, "Caller joining conference");

  return res.type("text/xml").send(twiml.toString());
}

// Hold/wait music while participants join
export async function waitMusicWebhook(req: Request, res: Response) {
  const twiml = new VoiceResponse();
  // Play looping hold music — Twilio requires URL to a WAV/MP3
  const play = twiml.play({}, "http://com.twilio.s3.amazonaws.com/music/soft-rock.mp3");
  play.loop = 10;
  return res.type("text/xml").send(twiml.toString());
}

// Status callback during conference lifecycle
export async function conferenceStatusWebhook(req: Request, res: Response) {
  const confId = req.query.id as string;
  const status = req.body.StatusCallbackEvent as string;
  const participants = parseInt(req.body.Participants ?? "0", 10);

  console.log({ confId, status, participants }, "Conference status callback");

  const [conf] = await db.select().from(conferences).where(eq(conferences.id, confId));
  if (!conf) return res.sendStatus(200);

  // Activate conference once first participant joins
  if (status === "participant-join" && participants > 0) {
    await db
      .update(conferences)
      .set({ status: "in-progress", isActive: true })
      .where(eq(conferences.id, confId));
  }

  // Mark ended once everyone leaves
  if (status === "participant-leave" && participants === 0) {
    await db
      .update(conferences)
      .set({ status: "completed", isActive: false, endedAt: new Date() })
      .where(eq(conferences.id, confId));
  }

  return res.sendStatus(200);
}

// ===== Helpers =====

function buildUrl(path: string): string {
  return `${env.PUBLIC_URL ?? `http://localhost:${env.PORT}`}${path}`;
}
