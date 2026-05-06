import { type UserRole } from "@prisma/client";
import { ez } from "express-zod-api";
import { z } from "zod";

const RoleSchema = z.enum(["CLIENT", "ADMIN", "SUPER_ADMIN"] as const satisfies UserRole[]);

export const PublicUserListItemSchema = z.object({
  id: z.string(),
  email: z.email(),
  role: RoleSchema,
  balanceCents: z.int(),
  createdAt: ez.dateOut(),
});

export const ListUsersInputSchema = z.object({});
export const ListUsersOutputSchema = z.object({
  items: z.array(PublicUserListItemSchema),
});

export const UserIdParamsSchema = z.object({ id: z.string().min(1) });

export const UserDetailOutputSchema = PublicUserListItemSchema.extend({
  stats: z.object({
    ticketsCount: z.int().nonnegative(),
    usagesCount: z.int().nonnegative(),
    transactionsCount: z.int().nonnegative(),
  }),
  recentUsages: z.array(
    z.object({
      sessionId: z.string(),
      usedAt: ez.dateOut(),
      movie: z.object({ id: z.string(), title: z.string() }),
      room: z.object({ id: z.string(), name: z.string() }),
    }),
  ),
});
