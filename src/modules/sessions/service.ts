import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma.js";
import { hasSufficientDuration, isWithinBusinessHours, minSessionDurationMin } from "../../lib/businessHours.js";
import { ConflictError, NotFoundError, UnprocessableError } from "../../lib/errors.js";

interface CreateSessionData {
  movieId: string;
  roomId: string;
  startsAt: Date;
  endsAt: Date;
  priceCents: number;
}

interface UpdateSessionData {
  movieId?: string;
  roomId?: string;
  startsAt?: Date;
  endsAt?: Date;
  priceCents?: number;
}

interface ListRange {
  from?: Date;
  to?: Date;
}

const sessionDetailInclude = {
  movie: { select: { id: true, title: true, durationMin: true } },
  room: { select: { id: true, name: true, type: true } },
} satisfies Prisma.SessionInclude;

const findSessionOrThrow = async (id: string) => {
  const session = await prisma.session.findUnique({
    where: { id },
    include: sessionDetailInclude,
  });
  if (!session) throw new NotFoundError("Session not found");
  return session;
};

const ensureValidSchedule = async (
  movieId: string,
  roomId: string,
  startsAt: Date,
  endsAt: Date,
  excludeSessionId?: string,
) => {
  const [movie, room] = await Promise.all([
    prisma.movie.findUnique({ where: { id: movieId } }),
    prisma.room.findUnique({ where: { id: roomId } }),
  ]);
  if (!movie) throw new NotFoundError("Movie not found");
  if (!room) throw new NotFoundError("Room not found");
  if (room.underMaintenance) {
    throw new UnprocessableError("Room is under maintenance");
  }
  if (!isWithinBusinessHours(startsAt, endsAt)) {
    throw new UnprocessableError("Session must fit within a single open day, Mon–Fri 09:00–20:00");
  }
  if (!hasSufficientDuration(startsAt, endsAt, movie.durationMin)) {
    throw new UnprocessableError(
      `Session must last at least ${minSessionDurationMin(movie.durationMin).toString()} min (movie + 30 min for ads/cleanup)`,
    );
  }
  const conflicting = await prisma.session.findFirst({
    where: {
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      OR: [{ roomId }, { movieId }],
      ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
    },
    select: { id: true },
  });
  if (conflicting) {
    throw new ConflictError("Session overlaps with another in the same room or for the same movie");
  }
};

export const sessionsService = {
  list: async (range: ListRange) => {
    const items = await prisma.session.findMany({
      where: {
        ...(range.from || range.to
          ? {
              startsAt: {
                ...(range.from ? { gte: range.from } : {}),
                ...(range.to ? { lte: range.to } : {}),
              },
            }
          : {}),
        room: { underMaintenance: false },
      },
      include: sessionDetailInclude,
      orderBy: { startsAt: "asc" },
    });
    return { items };
  },

  getById: (id: string) => findSessionOrThrow(id),

  create: async (data: CreateSessionData) => {
    await ensureValidSchedule(data.movieId, data.roomId, data.startsAt, data.endsAt);
    return prisma.session.create({ data, include: sessionDetailInclude });
  },

  update: async (id: string, data: UpdateSessionData) => {
    const existing = await findSessionOrThrow(id);
    const merged = {
      movieId: data.movieId ?? existing.movieId,
      roomId: data.roomId ?? existing.roomId,
      startsAt: data.startsAt ?? existing.startsAt,
      endsAt: data.endsAt ?? existing.endsAt,
      priceCents: data.priceCents ?? existing.priceCents,
    };
    await ensureValidSchedule(merged.movieId, merged.roomId, merged.startsAt, merged.endsAt, id);
    return prisma.session.update({ where: { id }, data: merged, include: sessionDetailInclude });
  },

  delete: async (id: string) => {
    await findSessionOrThrow(id);
    try {
      await prisma.session.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        throw new ConflictError("Cannot delete a session that already has tickets used");
      }
      throw err;
    }
    return { id };
  },

  attendance: async (id: string) => {
    await findSessionOrThrow(id);
    const attendeesCount = await prisma.ticketUsage.count({ where: { sessionId: id } });
    return { sessionId: id, attendeesCount };
  },
};
