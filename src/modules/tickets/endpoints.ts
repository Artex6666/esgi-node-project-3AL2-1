import { authedFactory } from "../../factories/authed.js";
import {
  BuyTicketInputSchema,
  BuyTicketOutputSchema,
  ListTicketsInputSchema,
  ListTicketsOutputSchema,
  ListTicketUsagesInputSchema,
  ListTicketUsagesOutputSchema,
  UseTicketInputSchema,
  UseTicketOutputSchema,
} from "./schemas.js";
import { ticketsService } from "./service.js";

export const buyTicketEndpoint = authedFactory.build({
  method: "post",
  input: BuyTicketInputSchema,
  output: BuyTicketOutputSchema,
  handler: ({ input, ctx }) => ticketsService.buy(ctx.user.id, input.kind),
});

export const listMyTicketsEndpoint = authedFactory.build({
  method: "get",
  input: ListTicketsInputSchema,
  output: ListTicketsOutputSchema,
  handler: ({ ctx }) => ticketsService.listMine(ctx.user.id),
});

export const useTicketEndpoint = authedFactory.build({
  method: "post",
  input: UseTicketInputSchema,
  output: UseTicketOutputSchema,
  handler: ({ input, ctx }) => ticketsService.use(ctx.user.id, input.ticketId, input.sessionId),
});

export const listMyTicketUsagesEndpoint = authedFactory.build({
  method: "get",
  input: ListTicketUsagesInputSchema,
  output: ListTicketUsagesOutputSchema,
  handler: ({ ctx }) => ticketsService.listMyUsages(ctx.user.id),
});
