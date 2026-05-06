import createHttpError from "http-errors";
import { z } from "zod";

import { logger } from "../../config/logger.js";
import { prisma } from "../../config/prisma.js";
import { authedFactory } from "../../factories/authed.js";

const schemaMontant = z.object({
    amountCents: z.number().int().positive(),
});

const schemaPortefeuille = z.object({
    balanceCents: z.number().int(),
});

const schemaTransaction = z.object({
    id: z.string(),
    amountCents: z.number().int(),
    kind: z.enum(["DEPOSIT", "WITHDRAWAL", "TICKET_PURCHASE"]),
    ticketId: z.string().nullable(),
    createdAt: z.date(),
});

export const getWalletEndpoint = authedFactory.build({
    method: "get",
    input: z.object({}),
    output: schemaPortefeuille,
    handler: async ({ ctx }) => {
        const userId = ctx.user.id;

        const utilisateur = await prisma.user.findUnique({
            where: { id: userId },
            select: { balanceCents: true },
        });

        if (!utilisateur) {
            throw createHttpError(404, "Utilisateur introuvable");
        }

        return {
            balanceCents: utilisateur.balanceCents,
        };
    },
});

export const depositEndpoint = authedFactory.build({
    method: "post",
    input: schemaMontant,
    output: schemaPortefeuille,
    handler: async ({ input, ctx }) => {
        const userId = ctx.user.id;

        const utilisateurMisAJour = await prisma.$transaction(async (tx) => {
            const utilisateur = await tx.user.update({
                where: { id: userId },
                data: {
                    balanceCents: {
                        increment: input.amountCents,
                    },
                },
                select: {
                    balanceCents: true,
                },
            });

            await tx.transaction.create({
                data: {
                    userId,
                    amountCents: input.amountCents,
                    kind: "DEPOSIT",
                },
            });

            return utilisateur;
        });

        logger.info({ userId, amountCents: input.amountCents }, "dépôt sur le portefeuille");

        return {
            balanceCents: utilisateurMisAJour.balanceCents,
        };
    },
});

export const withdrawEndpoint = authedFactory.build({
    method: "post",
    input: schemaMontant,
    output: schemaPortefeuille,
    handler: async ({ input, ctx }) => {
        const userId = ctx.user.id;

        const utilisateurMisAJour = await prisma.$transaction(async (tx) => {
            const updated = await tx.user.updateMany({
                where: { id: userId, balanceCents: { gte: input.amountCents } },
                data: { balanceCents: { decrement: input.amountCents } },
            });

            if (updated.count === 0) {
                throw createHttpError(400, "Solde insuffisant");
            }

            await tx.transaction.create({
                data: {
                    userId,
                    amountCents: -input.amountCents,
                    kind: "WITHDRAWAL",
                },
            });

            const resultat = await tx.user.findUniqueOrThrow({
                where: { id: userId },
                select: { balanceCents: true },
            });

            return resultat;
        });

        logger.info({ userId, amountCents: input.amountCents }, "retrait du portefeuille");

        return {
            balanceCents: utilisateurMisAJour.balanceCents,
        };
    },
});

export const getWalletTransactionsEndpoint = authedFactory.build({
    method: "get",
    input: z.object({}),
    output: z.object({
        transactions: z.array(schemaTransaction),
    }),
    handler: async ({ ctx }) => {
        const userId = ctx.user.id;

        const transactions = await prisma.transaction.findMany({
            where: { userId },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                amountCents: true,
                kind: true,
                ticketId: true,
                createdAt: true,
            },
        });

        return {
            transactions,
        };
    },
});