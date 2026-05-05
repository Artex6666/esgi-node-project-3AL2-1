import createHttpError from "http-errors";
import { z } from "zod";

import { prisma } from "../../config/prisma.js";
import { adminFactory } from "../../factories/admin.js";

const schemaPeriode = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const parsePeriode = (input: { from?: string; to?: string }) => {
  const from = input.from ? new Date(input.from) : undefined;
  const to = input.to ? new Date(input.to) : undefined;

  if (from && to && from >= to) {
    throw createHttpError(400, "`from` doit être avant `to`");
  }

  return { from, to };
};

const getDateKey = (date: Date) => date.toISOString().slice(0, 10);

const getWeekKey = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getUTCDay() || 7;

  copy.setUTCDate(copy.getUTCDate() - day + 1);
  copy.setUTCHours(0, 0, 0, 0);

  return getDateKey(copy);
};

export const getAttendanceStatsEndpoint = adminFactory.build({
  method: "get",
  input: schemaPeriode,
  output: z.object({
    attendeesCount: z.number().int(),
    sessionsCount: z.number().int(),
    totalCapacity: z.number().int(),
    occupancyRate: z.number(),
  }),
  handler: async ({ input }) => {
    const { from, to } = parsePeriode(input);

    const sessions = await prisma.session.findMany({
      where: {
        startsAt: {
          gte: from,
          lte: to,
        },
      },
      select: {
        id: true,
        room: {
          select: {
            capacity: true,
          },
        },
        _count: {
          select: {
            ticketUsages: true,
          },
        },
      },
    });

    const attendeesCount = sessions.reduce((total, session) => total + session._count.ticketUsages, 0);

    const totalCapacity = sessions.reduce((total, session) => total + session.room.capacity, 0);

    const occupancyRate = totalCapacity === 0 ? 0 : attendeesCount / totalCapacity;

    return {
      attendeesCount,
      sessionsCount: sessions.length,
      totalCapacity,
      occupancyRate,
    };
  },
});

export const getDailyStatsEndpoint = adminFactory.build({
  method: "get",
  input: schemaPeriode,
  output: z.object({
    days: z.array(
      z.object({
        date: z.string(),
        attendeesCount: z.number().int(),
        sessionsCount: z.number().int(),
        totalCapacity: z.number().int(),
        occupancyRate: z.number(),
      }),
    ),
  }),
  handler: async ({ input }) => {
    const { from, to } = parsePeriode(input);

    const sessions = await prisma.session.findMany({
      where: {
        startsAt: {
          gte: from,
          lte: to,
        },
      },
      select: {
        startsAt: true,
        room: {
          select: {
            capacity: true,
          },
        },
        _count: {
          select: {
            ticketUsages: true,
          },
        },
      },
      orderBy: {
        startsAt: "asc",
      },
    });

    const grouped = new Map<
      string,
      {
        attendeesCount: number;
        sessionsCount: number;
        totalCapacity: number;
      }
    >();

    for (const session of sessions) {
      const key = getDateKey(session.startsAt);

      const current = grouped.get(key) ?? {
        attendeesCount: 0,
        sessionsCount: 0,
        totalCapacity: 0,
      };

      current.attendeesCount += session._count.ticketUsages;
      current.sessionsCount += 1;
      current.totalCapacity += session.room.capacity;

      grouped.set(key, current);
    }

    const days = [...grouped.entries()].map(([date, stats]) => ({
      date,
      attendeesCount: stats.attendeesCount,
      sessionsCount: stats.sessionsCount,
      totalCapacity: stats.totalCapacity,
      occupancyRate: stats.totalCapacity === 0 ? 0 : stats.attendeesCount / stats.totalCapacity,
    }));

    return { days };
  },
});

export const getWeeklyStatsEndpoint = adminFactory.build({
  method: "get",
  input: schemaPeriode,
  output: z.object({
    weeks: z.array(
      z.object({
        weekStart: z.string(),
        attendeesCount: z.number().int(),
        sessionsCount: z.number().int(),
        totalCapacity: z.number().int(),
        occupancyRate: z.number(),
      }),
    ),
  }),
  handler: async ({ input }) => {
    const { from, to } = parsePeriode(input);

    const sessions = await prisma.session.findMany({
      where: {
        startsAt: {
          gte: from,
          lte: to,
        },
      },
      select: {
        startsAt: true,
        room: {
          select: {
            capacity: true,
          },
        },
        _count: {
          select: {
            ticketUsages: true,
          },
        },
      },
      orderBy: {
        startsAt: "asc",
      },
    });

    const grouped = new Map<
      string,
      {
        attendeesCount: number;
        sessionsCount: number;
        totalCapacity: number;
      }
    >();

    for (const session of sessions) {
      const key = getWeekKey(session.startsAt);

      const current = grouped.get(key) ?? {
        attendeesCount: 0,
        sessionsCount: 0,
        totalCapacity: 0,
      };

      current.attendeesCount += session._count.ticketUsages;
      current.sessionsCount += 1;
      current.totalCapacity += session.room.capacity;

      grouped.set(key, current);
    }

    const weeks = [...grouped.entries()].map(([weekStart, stats]) => ({
      weekStart,
      attendeesCount: stats.attendeesCount,
      sessionsCount: stats.sessionsCount,
      totalCapacity: stats.totalCapacity,
      occupancyRate: stats.totalCapacity === 0 ? 0 : stats.attendeesCount / stats.totalCapacity,
    }));

    return { weeks };
  },
});

export const getSessionStatsEndpoint = adminFactory.build({
  method: "get",
  input: z.object({
    id: z.string(),
  }),
  output: z.object({
    sessionId: z.string(),
    attendeesCount: z.number().int(),
    capacity: z.number().int(),
    occupancyRate: z.number(),
  }),
  handler: async ({ input }) => {
    const session = await prisma.session.findUnique({
      where: {
        id: input.id,
      },
      select: {
        id: true,
        room: {
          select: {
            capacity: true,
          },
        },
        _count: {
          select: {
            ticketUsages: true,
          },
        },
      },
    });

    if (!session) {
      throw createHttpError(404, "Séance introuvable");
    }

    return {
      sessionId: session.id,
      attendeesCount: session._count.ticketUsages,
      capacity: session.room.capacity,
      occupancyRate: session.room.capacity === 0 ? 0 : session._count.ticketUsages / session.room.capacity,
    };
  },
});