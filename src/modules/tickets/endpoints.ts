import createHttpError from "http-errors";
import { z } from "zod";

import { logger } from "../../config/logger.js";
import { prisma } from "../../config/prisma.js";
import { authedFactory } from "../../factories/authed.js";

const PRIX_TICKETS = {
    STANDARD: 1000,
    SUPER: 8000,
} as const;

const USAGES_TICKETS = {
    STANDARD: 1,
    SUPER: 10,
} as const;

const schemaAchatTicket = z.object({
    kind: z.enum(["STANDARD", "SUPER"]),
});

const schemaUtilisationTicket = z.object({
    ticketId: z.string(),
    sessionId: z.string(),
});

const schemaTicket = z.object({
    id: z.string(),
    kind: z.enum(["STANDARD", "SUPER"]),
    usesRemaining: z.number().int(),
    purchasedAt: z.date(),
});

const schemaUsage = z.object({
    id: z.string(),
    ticketId: z.string(),
    sessionId: z.string(),
    usedAt: z.date(),
    session: z.object({
        id: z.string(),
        startsAt: z.date(),
        endsAt: z.date(),
        movie: z.object({
            id: z.string(),
            title: z.string(),
        }),
        room: z.object({
            id: z.string(),
            name: z.string(),
        }),
    }),
});

export const buyTicketEndpoint = authedFactory.build({
    method: "post",
    input: schemaAchatTicket,
    output: z.object({
        ticket: schemaTicket,
        balanceCents: z.number().int(),
    }),
    handler: async ({ input, ctx }) => {
        const userId = ctx.user.id;
        const priceCents = PRIX_TICKETS[input.kind];
        const usesRemaining = USAGES_TICKETS[input.kind];

        const resultat = await prisma.$transaction(async (tx) => {
            const updated = await tx.user.updateMany({
                where: { id: userId, balanceCents: { gte: priceCents } },
                data: { balanceCents: { decrement: priceCents } },
            });

            if (updated.count === 0) {
                throw createHttpError(400, "Solde insuffisant");
            }

            const ticket = await tx.ticket.create({
                data: {
                    userId,
                    kind: input.kind,
                    usesRemaining,
                },
                select: {
                    id: true,
                    kind: true,
                    usesRemaining: true,
                    purchasedAt: true,
                },
            });

            await tx.transaction.create({
                data: {
                    userId,
                    amountCents: -priceCents,
                    kind: "TICKET_PURCHASE",
                    ticketId: ticket.id,
                },
            });

            const utilisateurMisAJour = await tx.user.findUniqueOrThrow({
                where: { id: userId },
                select: { balanceCents: true },
            });

            return {
                ticket,
                balanceCents: utilisateurMisAJour.balanceCents,
            };
        });

        logger.info(
            { userId, ticketId: resultat.ticket.id, kind: input.kind, priceCents },
            "achat de ticket",
        );

        return resultat;
    },
});

export const getMyTicketsEndpoint = authedFactory.build({
    method: "get",
    input: z.object({}),
    output: z.object({
        tickets: z.array(schemaTicket),
    }),
    handler: async ({ ctx }) => {
        const userId = ctx.user.id;

        const tickets = await prisma.ticket.findMany({
            where: { userId },
            orderBy: { purchasedAt: "desc" },
            select: {
                id: true,
                kind: true,
                usesRemaining: true,
                purchasedAt: true,
            },
        });

        return { tickets };
    },
});

export const useTicketEndpoint = authedFactory.build({
    method: "post",
    input: schemaUtilisationTicket,
    output: z.object({
        ticketId: z.string(),
        sessionId: z.string(),
        usesRemaining: z.number().int(),
    }),
    handler: async ({ input, ctx }) => {
        const userId = ctx.user.id;

        const resultat = await prisma.$transaction(async (tx) => {
            await tx.$queryRaw`
        SELECT id FROM "Session"
        WHERE id = ${input.sessionId}
        FOR UPDATE
      `;

            const session = await tx.session.findUnique({
                where: { id: input.sessionId },
                include: { room: true },
            });

            if (!session) {
                throw createHttpError(404, "Séance introuvable");
            }

            if (session.room.underMaintenance) {
                throw createHttpError(400, "La salle est en maintenance");
            }

            if (session.startsAt < new Date()) {
                throw createHttpError(400, "Impossible d'utiliser un ticket sur une séance passée");
            }

            const ticket = await tx.ticket.findFirst({
                where: {
                    id: input.ticketId,
                    userId,
                },
            });

            if (!ticket) {
                throw createHttpError(404, "Ticket introuvable");
            }

            if (ticket.usesRemaining <= 0) {
                throw createHttpError(400, "Ce ticket n'a plus d'utilisation disponible");
            }

            const dejaUtilise = await tx.ticketUsage.findFirst({
                where: {
                    sessionId: input.sessionId,
                    ticket: {
                        userId,
                    },
                },
            });

            if (dejaUtilise) {
                throw createHttpError(400, "Vous avez déjà une place pour cette séance");
            }

            const nombreSpectateurs = await tx.ticketUsage.count({
                where: {
                    sessionId: input.sessionId,
                },
            });

            if (nombreSpectateurs >= session.room.capacity) {
                throw createHttpError(400, "Séance complète");
            }

            await tx.ticketUsage.create({
                data: {
                    ticketId: input.ticketId,
                    sessionId: input.sessionId,
                },
            });

            const ticketMisAJour = await tx.ticket.update({
                where: {
                    id: input.ticketId,
                },
                data: {
                    usesRemaining: {
                        decrement: 1,
                    },
                },
                select: {
                    usesRemaining: true,
                },
            });

            return {
                ticketId: input.ticketId,
                sessionId: input.sessionId,
                usesRemaining: ticketMisAJour.usesRemaining,
            };
        });

        logger.info(
            { userId, ticketId: input.ticketId, sessionId: input.sessionId },
            "utilisation de ticket",
        );

        return resultat;
    },
});

export const getMyTicketUsagesEndpoint = authedFactory.build({
    method: "get",
    input: z.object({}),
    output: z.object({
        usages: z.array(schemaUsage),
    }),
    handler: async ({ ctx }) => {
        const userId = ctx.user.id;

        const usages = await prisma.ticketUsage.findMany({
            where: {
                ticket: {
                    userId,
                },
            },
            orderBy: {
                usedAt: "desc",
            },
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
                        movie: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                        room: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        return { usages };
    },
});