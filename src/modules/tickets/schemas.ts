import { ez } from "express-zod-api";
import { z } from "zod";

export const TicketKindSchema = z.enum(["STANDARD", "SUPER"]);

export const TicketSchema = z.object({
  id: z.string(),
  kind: TicketKindSchema,
  usesRemaining: z.int().nonnegative(),
  purchasedAt: ez.dateOut(),
});

export const BuyTicketInputSchema = z.object({ kind: TicketKindSchema });
export const BuyTicketOutputSchema = z.object({
  ticket: TicketSchema,
  balanceCents: z.int(),
});

export const ListTicketsInputSchema = z.object({});
export const ListTicketsOutputSchema = z.object({ tickets: z.array(TicketSchema) });

export const UseTicketInputSchema = z.object({
  ticketId: z.string().min(1),
  sessionId: z.string().min(1),
});
export const UseTicketOutputSchema = z.object({
  ticketId: z.string(),
  sessionId: z.string(),
  usesRemaining: z.int().nonnegative(),
});

export const TicketUsageSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  sessionId: z.string(),
  usedAt: ez.dateOut(),
  session: z.object({
    id: z.string(),
    startsAt: ez.dateOut(),
    endsAt: ez.dateOut(),
    movie: z.object({ id: z.string(), title: z.string() }),
    room: z.object({ id: z.string(), name: z.string() }),
  }),
});

export const ListTicketUsagesInputSchema = z.object({});
export const ListTicketUsagesOutputSchema = z.object({
  usages: z.array(TicketUsageSchema),
});
