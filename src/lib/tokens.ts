import { createHash, randomBytes } from "node:crypto";

import { type UserRole } from "@prisma/client";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { UnauthorizedError } from "./errors.js";

export interface AccessTokenClaims {
  sub: string;
  role: UserRole;
}

const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");

export const signAccessToken = (userId: string, role: UserRole): string =>
  jwt.sign({ sub: userId, role } satisfies AccessTokenClaims, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_ACCESS_TTL_SEC,
  });

export const verifyAccessToken = (raw: string): AccessTokenClaims => {
  try {
    const decoded = jwt.verify(raw, env.JWT_SECRET, { algorithms: ["HS256"] });
    if (typeof decoded !== "object" || decoded === null) {
      throw new UnauthorizedError("Invalid access token");
    }
    const { sub, role } = decoded as Partial<AccessTokenClaims>;
    if (typeof sub !== "string" || typeof role !== "string") {
      throw new UnauthorizedError("Invalid access token");
    }
    return { sub, role };
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError("Invalid or expired access token", { cause: err });
  }
};

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
}

export const issueRefreshToken = async (userId: string): Promise<IssuedRefreshToken> => {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_SEC * 1000);
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
  return { token, expiresAt };
};

export interface RotatedRefreshToken {
  userId: string;
  role: UserRole;
  refresh: IssuedRefreshToken;
}

export const rotateRefreshToken = async (raw: string): Promise<RotatedRefreshToken> => {
  const tokenHash = hashToken(raw);
  const result = await prisma.$transaction(async (tx) => {
    const stored = await tx.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, role: true } } },
    });
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain -- explicit null check is clearer than `?.X !== null` here.
    if (!stored || stored.revokedAt !== null || stored.expiresAt <= new Date()) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
    await tx.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    const newRaw = randomBytes(32).toString("hex");
    const newExpiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_SEC * 1000);
    await tx.refreshToken.create({
      data: { userId: stored.userId, tokenHash: hashToken(newRaw), expiresAt: newExpiresAt },
    });
    return { userId: stored.userId, role: stored.user.role, token: newRaw, expiresAt: newExpiresAt };
  });
  return {
    userId: result.userId,
    role: result.role,
    refresh: { token: result.token, expiresAt: result.expiresAt },
  };
};

export const revokeAllRefreshTokensForUser = async (userId: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};
