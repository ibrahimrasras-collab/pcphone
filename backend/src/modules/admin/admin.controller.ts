import { Request, Response } from "express";
import { z } from "zod";
import { eq, desc, sql, count } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema/users.js";
import { extensions } from "../../db/schema/extensions.js";
import { dids } from "../../db/schema/dids.js";
import { callRecords } from "../../db/schema/call-records.js";
import { voicemailMessages } from "../../db/schema/voicemail-messages.js";
import { billingRecords } from "../../db/schema/billing-records.js";
import { NotFoundError, ValidationError } from "../../utils/errors.js";
import { sendSuccess } from "../../utils/response.js";

// ===== Users =====

export async function listUsers(req: Request, res: Response) {
  const page = parseInt((req.query.page as string) || "1");
  const perPage = Math.min(parseInt((req.query.per_page as string) || "20"), 100);
  const search = (req.query.search as string) || "";

  let query = db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      plan: users.plan,
      isActive: users.isActive,
      createdAt: users.createdAt,
      extension: extensions.extension,
    })
    .from(users)
    .leftJoin(extensions, eq(extensions.userId, users.id));

  if (search) {
    query = query.where(
      sql`${users.email} ILIKE ${`%${search}%`} OR ${users.name} ILIKE ${`%${search}%`}`,
    );
  }

  const rows = await query
    .orderBy(desc(users.createdAt))
    .limit(perPage)
    .offset((page - 1) * perPage);

  const [{ total }] = await db.select({ total: count() }).from(users);

  return sendSuccess(res, rows, { page, perPage, total });
}

export async function getUser(req: Request, res: Response) {
  const [user] = await db.select().from(users).where(eq(users.id, req.params.id));
  if (!user) throw new NotFoundError("User not found");

  const [ext] = await db.select().from(extensions).where(eq(extensions.userId, user.id));
  const [did] = await db.select().from(dids).where(eq(dids.assignedTo, user.id));

  return sendSuccess(res, { ...user, extension: ext, did });
}

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["user", "admin"]).optional(),
  plan: z.enum(["basic", "pro", "enterprise"]).optional(),
  isActive: z.boolean().optional(),
});

export async function updateUser(req: Request, res: Response) {
  const input = updateUserSchema.parse(req.body);

  const [updated] = await db
    .update(users)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(users.id, req.params.id))
    .returning();

  if (!updated) throw new NotFoundError("User not found");

  return sendSuccess(res, updated);
}

// ===== DIDs =====

export async function listDids(req: Request, res: Response) {
  const page = parseInt((req.query.page as string) || "1");
  const perPage = Math.min(parseInt((req.query.per_page as string) || "20"), 100);

  const rows = await db
    .select({
      id: dids.id,
      phoneNumber: dids.phoneNumber,
      assignedTo: dids.assignedTo,
      isActive: dids.isActive,
      createdAt: dids.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(dids)
    .leftJoin(users, eq(users.id, dids.assignedTo))
    .orderBy(dids.createdAt)
    .limit(perPage)
    .offset((page - 1) * perPage);

  const [{ total }] = await db.select({ total: count() }).from(dids);

  return sendSuccess(res, rows, { page, perPage, total });
}

const assignDidSchema = z.object({
  didId: z.string().uuid(),
  userId: z.string().uuid(),
});

export async function assignDid(req: Request, res: Response) {
  const input = assignDidSchema.parse(req.body);

  const [updated] = await db
    .update(dids)
    .set({ assignedTo: input.userId })
    .where(eq(dids.id, input.didId))
    .returning();

  if (!updated) throw new NotFoundError("DID not found");

  return sendSuccess(res, updated);
}

export async function unassignDid(req: Request, res: Response) {
  const [updated] = await db
    .update(dids)
    .set({ assignedTo: null })
    .where(eq(dids.id, req.params.id))
    .returning();

  if (!updated) throw new NotFoundError("DID not found");

  return sendSuccess(res, updated);
}

// ===== System Stats =====

export async function systemStats(req: Request, res: Response) {
  const [usersCount] = await db.select({ count: count() }).from(users);
  const [activeUsers] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.isActive, true));
  const [didsCount] = await db.select({ count: count() }).from(dids);
  const [assignedDids] = await db
    .select({ count: count() })
    .from(dids)
    .where(sql`${dids.assignedTo} IS NOT NULL`);
  const [callsToday] = await db
    .select({ count: count() })
    .from(callRecords)
    .where(sql`${callRecords.startedAt} >= CURRENT_DATE`);
  const [voicemailsCount] = await db.select({ count: count() }).from(voicemailMessages);
  const [unreadVoicemails] = await db
    .select({ count: count() })
    .from(voicemailMessages)
    .where(eq(voicemailMessages.isRead, false));

  const revenueResult = await db
    .select({ total: sql<string>`COALESCE(SUM(${billingRecords.amount}), 0)` })
    .from(billingRecords)
    .where(eq(billingRecords.status, "paid"));

  return sendSuccess(res, {
    users: {
      total: usersCount.count,
      active: activeUsers.count,
    },
    dids: {
      total: didsCount.count,
      assigned: assignedDids.count,
      available: didsCount.count - assignedDids.count,
    },
    calls: {
      today: callsToday.count,
    },
    voicemails: {
      total: voicemailsCount.count,
      unread: unreadVoicemails.count,
    },
    revenue: {
      total: revenueResult[0]?.total ?? "0",
    },
    serverTime: new Date().toISOString(),
  });
}

export async function recentCalls(req: Request, res: Response) {
  const limit = Math.min(parseInt((req.query.limit as string) || "20"), 100);

  const rows = await db
    .select({
      id: callRecords.id,
      direction: callRecords.direction,
      fromNumber: callRecords.fromNumber,
      toNumber: callRecords.toNumber,
      status: callRecords.status,
      durationSeconds: callRecords.durationSeconds,
      startedAt: callRecords.startedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(callRecords)
    .leftJoin(users, eq(users.id, callRecords.userId))
    .orderBy(desc(callRecords.startedAt))
    .limit(limit);

  return sendSuccess(res, rows);
}
