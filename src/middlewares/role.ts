import { type UserRole } from "@prisma/client";
import { Middleware } from "express-zod-api";
import { z } from "zod";

import { ForbiddenError } from "../lib/errors.js";

export const requireRole = (...allowed: [UserRole, ...UserRole[]]) =>
  new Middleware({
    input: z.object({}),
    handler: ({ ctx }) => {
      const user = (ctx as { user?: { role: UserRole } }).user;
      if (!user || !allowed.includes(user.role)) {
        throw new ForbiddenError("Insufficient role");
      }
      return Promise.resolve({});
    },
  });
