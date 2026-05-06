import { type TicketKind } from "@prisma/client";

import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { prisma } from "../../config/prisma.js";
import { ConflictError, NotFoundError, UnprocessableError } from "../../lib/errors.js";

const PRICE_BY_KIND: Record<TicketKind, number> = {
  STANDARD: env.TICKET_STANDARD_PRICE_CENTS,
  SUPER: env.TICKET_SUPER_PRICE_CENTS,
};

const USES_BY_KIND: Record<TicketKind, number> = {
  STANDARD: 1,
  SUPER: 10,
};

export const ticketsService = {
  buy: async (userId: string, kind: TicketKind) => {
    const priceCents = PRICE_BY_KIND[kind];
    const usesRemaining = USES_BY_KIND[kind];

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id: userId, balanceCents: { gte: priceCents } },
        data: { balanceCents: { decrement: priceCents } },
      });
      if (updated.count === 0) {
        throw new UnprocessableError("Insufficient balance");
      }
      const ticket = await tx.ticket.create({
        data: { userId, kind, usesRemaining },
        select: { id: true, kind: true, usesRemaining: true, purchasedAt: true },
      });
      await tx.transaction.create({
        data: { userId, amountCents: -priceCents, kind: "TICKET_PURCHASE", ticketId: ticket.id },
      });
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { balanceCents: true },
      });
      return { ticket, balanceCents: user.balanceCents };
    });

    logger.info({ userId, ticketId: result.ticket.id, kind, priceCents }, "ticket purchased");
    return result;
  },

  listMine: async (userId: string) => {
    const tickets = await prisma.ticket.findMany({
      where: { userId },
      orderBy: { purchasedAt: "desc" },
      select: { id: true, kind: true, usesRemaining: true, purchasedAt: true },
    });
    return { tickets };
  },

  use: async (userId: string, ticketId: string, sessionId: string) => {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Session" WHERE id = ${sessionId} FOR UPDATE`;

      const session = await tx.session.findUnique({
        where: { id: sessionId },
        include: { room: true },
      });
      if (!session) throw new NotFoundError("Session not found");
      if (session.room.underMaintenance) {
        throw new UnprocessableError("Room is under maintenance");
      }
      if (session.startsAt < new Date()) {
        throw new UnprocessableError("Cannot use a ticket on a past session");
      }

      const ticket = await tx.ticket.findFirst({ where: { id: ticketId, userId } });
      if (!ticket) throw new NotFoundError("Ticket not found");
      if (ticket.usesRemaining <= 0) {
        throw new UnprocessableError("Ticket has no remaining uses");
      }

      const alreadySeated = await tx.ticketUsage.findFirst({
        where: { sessionId, ticket: { userId } },
      });
      if (alreadySeated) {
        throw new ConflictError("User already has a seat for this session");
      }

      const seatedCount = await tx.ticketUsage.count({ where: { sessionId } });
      if (seatedCount >= session.room.capacity) {
        throw new ConflictError("Session is full");
      }

      await tx.ticketUsage.create({ data: { ticketId, sessionId } });
      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: { usesRemaining: { decrement: 1 } },
        select: { usesRemaining: true },
      });

      return { ticketId, sessionId, usesRemaining: updatedTicket.usesRemaining };
    });

    logger.info({ userId, ticketId, sessionId }, "ticket used");
    return result;
  },

  listMyUsages: async (userId: string) => {
    const usages = await prisma.ticketUsage.findMany({
      where: { ticket: { userId } },
      orderBy: { usedAt: "desc" },
      select: {
        id: true,
        ticketId: true,
        sessionId: true,
        usedAt: true,
        session: {
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            movie: { select: { id: true, title: true } },
            room: { select: { id: true, name: true } },
          },
        },
      },
    });
    return { usages };
  },
};
