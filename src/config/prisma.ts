import { PrismaClient, type Prisma } from "@prisma/client";

import { env } from "./env.js";
import { logger } from "./logger.js";

const logConfig = [
  { level: "warn", emit: "event" },
  { level: "error", emit: "event" },
] as const satisfies Prisma.LogDefinition[];

const buildClient = () => {
  const client = new PrismaClient({ log: [...logConfig] });
  client.$on("warn", (e) => logger.warn({ target: e.target }, e.message));
  client.$on("error", (e) => logger.error({ target: e.target }, e.message));
  return client;
};

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof buildClient> };

export const prisma = globalForPrisma.prisma ?? buildClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
