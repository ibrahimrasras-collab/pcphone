import { Request, Response } from "express";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { voicemailMessages } from "../../db/schema/voicemail-messages.js";
import { NotFoundError } from "../../utils/errors.js";
import { sendSuccess } from "../../utils/response.js";

export async function listVoicemails(req: Request, res: Response) {
  const page = parseInt((req.query.page as string) || "1");
  const perPage = Math.min(parseInt((req.query.per_page as string) || "20"), 100);

  const items = await db
    .select()
    .from(voicemailMessages)
    .where(eq(voicemailMessages.userId, req.user!.sub))
    .orderBy(desc(voicemailMessages.receivedAt))
    .limit(perPage)
    .offset((page - 1) * perPage);

  return sendSuccess(res, items, { page, perPage, total: items.length });
}

export async function getVoicemail(req: Request, res: Response) {
  const [voicemail] = await db
    .select()
    .from(voicemailMessages)
    .where(eq(voicemailMessages.id, req.params.id));

  if (!voicemail || voicemail.userId !== req.user!.sub) {
    throw new NotFoundError("Voicemail not found");
  }

  return sendSuccess(res, voicemail);
}

export async function markAsRead(req: Request, res: Response) {
  const schema = z.object({ isRead: z.boolean() });
  const input = schema.parse(req.body);

  const [voicemail] = await db
    .update(voicemailMessages)
    .set({ isRead: input.isRead })
    .where(eq(voicemailMessages.id, req.params.id))
    .returning();

  if (!voicemail || voicemail.userId !== req.user!.sub) {
    throw new NotFoundError("Voicemail not found");
  }

  return sendSuccess(res, voicemail);
}

export async function deleteVoicemail(req: Request, res: Response) {
  const [voicemail] = await db
    .select()
    .from(voicemailMessages)
    .where(eq(voicemailMessages.id, req.params.id));

  if (!voicemail || voicemail.userId !== req.user!.sub) {
    throw new NotFoundError("Voicemail not found");
  }

  await db
    .delete(voicemailMessages)
    .where(eq(voicemailMessages.id, req.params.id));

  return sendSuccess(res, { message: "Voicemail deleted" });
}
