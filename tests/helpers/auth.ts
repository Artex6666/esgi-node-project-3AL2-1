import { type UserRole } from "@prisma/client";
import argon2 from "argon2";

import { prisma } from "../../src/config/prisma.js";
import { signAccessToken } from "../../src/lib/tokens.js";

interface SeedUserOptions {
  email?: string;
  password?: string;
  role?: UserRole;
  balanceCents?: number;
}

export async function seedUser({
  email = `user-${crypto.randomUUID()}@cinema.test`,
  password = "password123",
  role,
  balanceCents = 0,
}: SeedUserOptions = {}) {
  const passwordHash = await argon2.hash(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, role, balanceCents },
  });
  const token = signAccessToken(user.id, user.role);
  return { user, password, token, authHeader: `Bearer ${token}` };
}
