import { ez } from "express-zod-api";
import { z } from "zod";

export const AmountInputSchema = z.object({
  amountCents: z.int().positive().max(100_000_000),
});

export const WalletBalanceSchema = z.object({
  balanceCents: z.int(),
});

export const TransactionSchema = z.object({
  id: z.string(),
  amountCents: z.int(),
  kind: z.enum(["DEPOSIT", "WITHDRAWAL", "TICKET_PURCHASE"]),
  ticketId: z.string().nullable(),
  createdAt: ez.dateOut(),
});

export const ListTransactionsInputSchema = z.object({});
export const ListTransactionsOutputSchema = z.object({
  transactions: z.array(TransactionSchema),
});

export const AdminTransactionSchema = TransactionSchema.extend({
  userId: z.string(),
  user: z.object({ id: z.string(), email: z.email() }),
});

export const ListAllTransactionsInputSchema = z.object({
  userId: z.string().optional(),
});
export const ListAllTransactionsOutputSchema = z.object({
  transactions: z.array(AdminTransactionSchema),
});
