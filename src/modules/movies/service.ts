import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma.js";
import { ConflictError, NotFoundError } from "../../lib/errors.js";

interface CreateMovieData {
  title: string;
  description: string;
  durationMin: number;
  genre: string;
  releasedAt: Date;
}

interface UpdateMovieData {
  title?: string;
  description?: string;
  durationMin?: number;
  genre?: string;
  releasedAt?: Date;
}

interface PlanningRange {
  from?: Date;
  to?: Date;
}

const findMovieOrThrow = async (id: string) => {
  const movie = await prisma.movie.findUnique({ where: { id } });
  if (!movie) throw new NotFoundError("Movie not found");
  return movie;
};

export const moviesService = {
  list: async () => {
    const items = await prisma.movie.findMany({ orderBy: { releasedAt: "desc" } });
    return { items };
  },

  getById: (id: string) => findMovieOrThrow(id),

  create: (data: CreateMovieData) => prisma.movie.create({ data }),

  update: async (id: string, data: UpdateMovieData) => {
    await findMovieOrThrow(id);
    return prisma.movie.update({ where: { id }, data });
  },

  delete: async (id: string) => {
    await findMovieOrThrow(id);
    try {
      await prisma.movie.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        throw new ConflictError("Cannot delete a movie that still has scheduled sessions");
      }
      throw err;
    }
    return { id };
  },

  planning: async (id: string, range: PlanningRange) => {
    await findMovieOrThrow(id);
    const sessions = await prisma.session.findMany({
      where: {
        movieId: id,
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
      include: { room: { select: { id: true, name: true, type: true } } },
      orderBy: { startsAt: "asc" },
    });
    return {
      movieId: id,
      items: sessions.map((s) => ({
        id: s.id,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        priceCents: s.priceCents,
        room: s.room,
      })),
    };
  },
};
