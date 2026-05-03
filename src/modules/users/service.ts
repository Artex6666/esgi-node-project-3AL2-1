import { prisma } from "../../config/prisma.js";
import { NotFoundError } from "../../lib/errors.js";

export const usersService = {
  getById: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, balanceCents: true, createdAt: true },
    });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  },
};
