import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma.js";
import { ConflictError, NotFoundError } from "../../lib/errors.js";

interface CreateRoomData {
  name: string;
  description: string;
  images: string[];
  type: string;
  capacity: number;
  accessible: boolean;
}

interface UpdateRoomData {
  name?: string;
  description?: string;
  images?: string[];
  type?: string;
  capacity?: number;
  accessible?: boolean;
}

const findRoomOrThrow = async (id: string) => {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw new NotFoundError("Room not found");
  return room;
};

export const roomsService = {
  list: async () => {
    const items = await prisma.room.findMany({ orderBy: { name: "asc" } });
    return { items };
  },

  getById: (id: string) => findRoomOrThrow(id),

  create: async (data: CreateRoomData) => {
    try {
      return await prisma.room.create({ data });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError("Room name already in use");
      }
      throw err;
    }
  },

  update: async (id: string, data: UpdateRoomData) => {
    await findRoomOrThrow(id);
    try {
      return await prisma.room.update({ where: { id }, data });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError("Room name already in use");
      }
      throw err;
    }
  },

  delete: async (id: string) => {
    await findRoomOrThrow(id);
    try {
      await prisma.room.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        throw new ConflictError("Cannot delete a room that still has scheduled sessions");
      }
      throw err;
    }
    return { id };
  },

  setMaintenance: async (id: string, underMaintenance: boolean) => {
    await findRoomOrThrow(id);
    return prisma.room.update({ where: { id }, data: { underMaintenance } });
  },
};
