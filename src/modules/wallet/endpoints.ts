import { z } from "zod";

import { authedFactory } from "../../factories/authed.js";
import {
  AmountInputSchema,
  ListTransactionsInputSchema,
  ListTransactionsOutputSchema,
  WalletBalanceSchema,
} from "./schemas.js";
import { walletService } from "./service.js";

export const getWalletEndpoint = authedFactory.build({
  method: "get",
  input: z.object({}),
  output: WalletBalanceSchema,
  handler: ({ ctx }) => walletService.getBalance(ctx.user.id),
});

export const depositEndpoint = authedFactory.build({
  method: "post",
  input: AmountInputSchema,
  output: WalletBalanceSchema,
  handler: ({ input, ctx }) => walletService.deposit(ctx.user.id, input.amountCents),
});

export const withdrawEndpoint = authedFactory.build({
  method: "post",
  input: AmountInputSchema,
  output: WalletBalanceSchema,
  handler: ({ input, ctx }) => walletService.withdraw(ctx.user.id, input.amountCents),
});

export const listMyTransactionsEndpoint = authedFactory.build({
  method: "get",
  input: ListTransactionsInputSchema,
  output: ListTransactionsOutputSchema,
  handler: ({ ctx }) => walletService.listTransactions(ctx.user.id),
});
