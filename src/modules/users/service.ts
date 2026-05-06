import { prisma } from "../../config/prisma.js";
import { NotFoundError } from "../../lib/errors.js";

const PUBLIC_FIELDS = {
  id: true,
  email: true,
  role: true,
  balanceCents: true,
  createdAt: true,
} as const;

export const usersService = {
  getById: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: PUBLIC_FIELDS,
    });
    if (!user) throw new NotFoundError("User not found");
    return user;
  },

  listAll: async () => {
    const items = await prisma.user.findMany({
      select: PUBLIC_FIELDS,
      orderBy: { createdAt: "desc" },
    });
    return { items };
  },

  getDetailed: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: PUBLIC_FIELDS,
    });
    if (!user) throw new NotFoundError("User not found");

    const [ticketsCount, usagesCount, transactionsCount, recentUsages] = await Promise.all([
      prisma.ticket.count({ where: { userId: id } }),
      prisma.ticketUsage.count({ where: { ticket: { userId: id } } }),
      prisma.transaction.count({ where: { userId: id } }),
      prisma.ticketUsage.findMany({
        where: { ticket: { userId: id } },
        orderBy: { usedAt: "desc" },
        take: 10,
        select: {
          sessionId: true,
          usedAt: true,
          session: {
            select: {
              movie: { select: { id: true, title: true } },
              room: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    return {
      ...user,
      stats: { ticketsCount, usagesCount, transactionsCount },
      recentUsages: recentUsages.map((u) => ({
        sessionId: u.sessionId,
        usedAt: u.usedAt,
        movie: u.session.movie,
        room: u.session.room,
      })),
    };
  },
};
