import { prisma } from "../../config/prisma.js";
import { BadRequestError, NotFoundError } from "../../lib/errors.js";

interface PeriodRange {
  from?: Date;
  to?: Date;
}

interface SessionForStats {
  startsAt: Date;
  room: { capacity: number };
  _count: { ticketUsages: number };
}

const occupancy = (attendees: number, capacity: number) =>
  capacity === 0 ? 0 : attendees / capacity;

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

const isoWeekStartKey = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  copy.setUTCHours(0, 0, 0, 0);
  return dateKey(copy);
};

const validatePeriod = (range: PeriodRange) => {
  if (range.from && range.to && range.from >= range.to) {
    throw new BadRequestError("`from` must be before `to`");
  }
  return range;
};

const findSessionsForStats = (range: PeriodRange) =>
  prisma.session.findMany({
    where: {
      startsAt: { gte: range.from, lte: range.to },
    },
    select: {
      startsAt: true,
      room: { select: { capacity: true } },
      _count: { select: { ticketUsages: true } },
    },
    orderBy: { startsAt: "asc" },
  });

interface Bucket {
  attendeesCount: number;
  sessionsCount: number;
  totalCapacity: number;
}

const emptyBucket = (): Bucket => ({ attendeesCount: 0, sessionsCount: 0, totalCapacity: 0 });

const groupSessionsBy = (sessions: SessionForStats[], keyFn: (s: SessionForStats) => string) => {
  const grouped = new Map<string, Bucket>();
  for (const session of sessions) {
    const key = keyFn(session);
    const current = grouped.get(key) ?? emptyBucket();
    current.attendeesCount += session._count.ticketUsages;
    current.sessionsCount += 1;
    current.totalCapacity += session.room.capacity;
    grouped.set(key, current);
  }
  return grouped;
};

export const statsService = {
  attendance: async (range: PeriodRange) => {
    validatePeriod(range);
    const sessions = await findSessionsForStats(range);
    const attendeesCount = sessions.reduce((t, s) => t + s._count.ticketUsages, 0);
    const totalCapacity = sessions.reduce((t, s) => t + s.room.capacity, 0);
    return {
      attendeesCount,
      sessionsCount: sessions.length,
      totalCapacity,
      occupancyRate: occupancy(attendeesCount, totalCapacity),
    };
  },

  daily: async (range: PeriodRange) => {
    validatePeriod(range);
    const sessions = await findSessionsForStats(range);
    const grouped = groupSessionsBy(sessions, (s) => dateKey(s.startsAt));
    return {
      days: [...grouped.entries()].map(([date, b]) => ({
        date,
        ...b,
        occupancyRate: occupancy(b.attendeesCount, b.totalCapacity),
      })),
    };
  },

  weekly: async (range: PeriodRange) => {
    validatePeriod(range);
    const sessions = await findSessionsForStats(range);
    const grouped = groupSessionsBy(sessions, (s) => isoWeekStartKey(s.startsAt));
    return {
      weeks: [...grouped.entries()].map(([weekStart, b]) => ({
        weekStart,
        ...b,
        occupancyRate: occupancy(b.attendeesCount, b.totalCapacity),
      })),
    };
  },

  forSession: async (sessionId: string) => {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        room: { select: { capacity: true } },
        _count: { select: { ticketUsages: true } },
      },
    });
    if (!session) throw new NotFoundError("Session not found");
    const attendeesCount = session._count.ticketUsages;
    const capacity = session.room.capacity;
    return {
      sessionId: session.id,
      attendeesCount,
      capacity,
      occupancyRate: occupancy(attendeesCount, capacity),
    };
  },
};
