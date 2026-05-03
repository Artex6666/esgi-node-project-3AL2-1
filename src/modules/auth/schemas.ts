import { type UserRole } from "@prisma/client";
import { ez } from "express-zod-api";
import { z } from "zod";

export const PublicUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  role: z.enum(["CLIENT", "ADMIN", "SUPER_ADMIN"] as const satisfies UserRole[]),
  balanceCents: z.int().nonnegative(),
  createdAt: ez.dateOut(),
});

export const TokensSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresInSec: z.int().positive(),
  refreshToken: z.string(),
  refreshTokenExpiresAt: ez.dateOut(),
});

export const CredentialsSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(200),
});

export const AuthResponseSchema = z.object({
  user: PublicUserSchema,
  tokens: TokensSchema,
});

export const RefreshInputSchema = z.object({
  refreshToken: z.string().min(1),
});

export const RefreshOutputSchema = z.object({
  tokens: TokensSchema,
});

export const LogoutOutputSchema = z.object({});
