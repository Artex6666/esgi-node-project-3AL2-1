import { prisma } from "../../config/prisma.js";

export const moviesService = {
  list: async () => {
    const items = await prisma.movie.findMany({ orderBy: { releasedAt: "desc" } });
    return { items };
  },
};
