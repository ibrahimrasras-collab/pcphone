import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { db } from "../../db/index.js";
import { users } from "../../db/schema/users.js";
import { extensions } from "../../db/schema/extensions.js";
import { refreshTokens } from "../../db/schema/refresh-tokens.js";
import { callForwarding } from "../../db/schema/call-forwarding.js";
import { voicemailSettings } from "../../db/schema/voicemail-settings.js";
import { env } from "../../config/env.js";
import { ValidationError, UnauthorizedError } from "../../utils/errors.js";
import { eq, and, sql } from "drizzle-orm";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

function generateAccessToken(user: { id: string; email: string; role: string; extension: string }) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, ext: user.extension },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("base64url");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function getNextExtension(): Promise<string> {
  const result = await db
    .select({ maxExt: sql<string>`MAX(extension)` })
    .from(extensions);
  const currentMax = result[0]?.maxExt ?? "1000";
  return String(Number(currentMax) + 1);
}

export async function register(input: RegisterInput) {
  const existing = await db.select().from(users).where(eq(users.email, input.email));
  if (existing.length > 0) {
    throw new ValidationError("Email already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const extensionNum = await getNextExtension();

  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash,
      name: input.name,
    })
    .returning();

  await db.insert(extensions).values({
    userId: user.id,
    extension: extensionNum,
  });

  await db.insert(callForwarding).values({ userId: user.id });
  await db.insert(voicemailSettings).values({ userId: user.id });

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    extension: extensionNum,
  });
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN * 1000),
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      extension: extensionNum,
      createdAt: user.createdAt,
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRES_IN,
    },
  };
}

export async function login(input: LoginInput, deviceInfo?: string, ipAddress?: string) {
  const [user] = await db.select().from(users).where(eq(users.email, input.email));
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (!user.isActive) {
    throw new UnauthorizedError("Account is disabled");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const [ext] = await db
    .select()
    .from(extensions)
    .where(eq(extensions.userId, user.id));

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    extension: ext?.extension ?? "1000",
  });
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash,
    deviceInfo: deviceInfo ?? null,
    ipAddress: ipAddress ?? null,
    expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN * 1000),
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      extension: ext?.extension ?? "1000",
      createdAt: user.createdAt,
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRES_IN,
    },
  };
}

export async function refresh(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash));

  if (!stored) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (new Date() > stored.expiresAt) {
    await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));
    throw new UnauthorizedError("Refresh token expired");
  }

  const [user] = await db.select().from(users).where(eq(users.id, stored.userId));
  if (!user || !user.isActive) {
    await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));
    throw new UnauthorizedError("Account not found or disabled");
  }

  const [ext] = await db
    .select()
    .from(extensions)
    .where(eq(extensions.userId, user.id));

  await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));

  const newAccessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    extension: ext?.extension ?? "1000",
  });
  const newRefreshToken = generateRefreshToken();
  const newHash = hashToken(newRefreshToken);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: newHash,
    expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN * 1000),
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: env.JWT_EXPIRES_IN,
  };
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function getUser(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return null;

  const [ext] = await db
    .select()
    .from(extensions)
    .where(eq(extensions.userId, user.id));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan,
    extension: ext?.extension ?? null,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}
