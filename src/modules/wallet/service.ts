import { logger } from "../../config/logger.js";
import { prisma } from "../../config/prisma.js";
import { UnprocessableError } from "../../lib/errors.js";

export const walletService = {
  getBalance: async (userId: string) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { balanceCents: true },
    });
    return { balanceCents: user.balanceCents };
  },

  deposit: async (userId: string, amountCents: number) => {
    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { balanceCents: { increment: amountCents } },
        select: { balanceCents: true },
      });
      await tx.transaction.create({
        data: { userId, amountCents, kind: "DEPOSIT" },
      });
      return user;
    });
    logger.info({ userId, amountCents }, "wallet deposit");
    return { balanceCents: updated.balanceCents };
  },

  withdraw: async (userId: string, amountCents: number) => {
    const updated = await prisma.$transaction(async (tx) => {
      const conditional = await tx.user.updateMany({
        where: { id: userId, balanceCents: { gte: amountCents } },
        data: { balanceCents: { decrement: amountCents } },
      });
      if (conditional.count === 0) {
        throw new UnprocessableError("Insufficient balance");
      }
      await tx.transaction.create({
        data: { userId, amountCents: -amountCents, kind: "WITHDRAWAL" },
      });
      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { balanceCents: true },
      });
    });
    logger.info({ userId, amountCents }, "wallet withdrawal");
    return { balanceCents: updated.balanceCents };
  },

  listTransactions: async (userId: string) => {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amountCents: true,
        kind: true,
        ticketId: true,
        createdAt: true,
      },
    });
    return { transactions };
  },
};
