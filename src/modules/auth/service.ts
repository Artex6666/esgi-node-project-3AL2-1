import { Prisma, type User } from "@prisma/client";
import argon2 from "argon2";

import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { ConflictError, UnauthorizedError } from "../../lib/errors.js";
import {
  type IssuedRefreshToken,
  issueRefreshToken,
  revokeAllRefreshTokensForUser,
  rotateRefreshToken,
  signAccessToken,
} from "../../lib/tokens.js";

const buildTokens = async (user: Pick<User, "id" | "role">) => {
  const accessToken = signAccessToken(user.id, user.role);
  const refresh: IssuedRefreshToken = await issueRefreshToken(user.id);
  return {
    accessToken,
    accessTokenExpiresInSec: env.JWT_ACCESS_TTL_SEC,
    refreshToken: refresh.token,
    refreshTokenExpiresAt: refresh.expiresAt,
  };
};

const toPublic = (user: User) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  balanceCents: user.balanceCents,
  createdAt: user.createdAt,
});

export const authService = {
  register: async (email: string, password: string) => {
    const passwordHash = await argon2.hash(password);
    let user: User;
    try {
      user = await prisma.user.create({ data: { email, passwordHash } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError("Email already registered");
      }
      throw err;
    }
    const tokens = await buildTokens(user);
    return { user: toPublic(user), tokens };
  },

  login: async (email: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    const isValid = user ? await argon2.verify(user.passwordHash, password) : false;
    if (!user || !isValid) {
      throw new UnauthorizedError("Invalid credentials");
    }
    const tokens = await buildTokens(user);
    return { user: toPublic(user), tokens };
  },

  refresh: async (rawToken: string) => {
    const result = await rotateRefreshToken(rawToken);
    const accessToken = signAccessToken(result.userId, result.role);
    return {
      tokens: {
        accessToken,
        accessTokenExpiresInSec: env.JWT_ACCESS_TTL_SEC,
        refreshToken: result.refresh.token,
        refreshTokenExpiresAt: result.refresh.expiresAt,
      },
    };
  },

  logout: async (userId: string) => {
    await revokeAllRefreshTokensForUser(userId);
    return {};
  },
};
