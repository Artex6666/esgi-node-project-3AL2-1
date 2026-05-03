import { type UserRole } from "@prisma/client";
import { Middleware } from "express-zod-api";
import { z } from "zod";

import { prisma } from "../config/prisma.js";
import { UnauthorizedError } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/tokens.js";

export interface AuthedUser {
  id: string;
  email: string;
  role: UserRole;
  balanceCents: number;
}

export const authMiddleware = new Middleware({
  security: { type: "bearer", format: "JWT" },
  input: z.object({}),
  handler: async ({ request }) => {
    const header = request.header("authorization") ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) {
      throw new UnauthorizedError("Missing or malformed Authorization header");
    }
    const claims = verifyAccessToken(match[1]!);
    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      select: { id: true, email: true, role: true, balanceCents: true },
    });
    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }
    return { user };
  },
});
