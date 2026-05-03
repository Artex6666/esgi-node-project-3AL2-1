import { Prisma } from "@prisma/client";

import { prisma } from "../../src/config/prisma.js";

const TABLES_IN_DELETE_ORDER = [
  "TicketUsage",
  "Transaction",
  "Ticket",
  "Session",
  "Movie",
  "Room",
  "EmployeeShift",
  "RefreshToken",
  "User",
] as const;

export async function truncateAll(): Promise<void> {
  const list = TABLES_IN_DELETE_ORDER.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

export { Prisma, prisma };
