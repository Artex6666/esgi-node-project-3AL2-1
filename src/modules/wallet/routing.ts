import type { Routing } from "express-zod-api";

import {
  depositEndpoint,
  getWalletEndpoint,
  listAllTransactionsEndpoint,
  listMyTransactionsEndpoint,
  withdrawEndpoint,
} from "./endpoints.js";

export const walletRouting: Routing = {
  get: getWalletEndpoint,
  deposit: depositEndpoint,
  withdraw: withdrawEndpoint,
  transactions: listMyTransactionsEndpoint,
  "all-transactions": listAllTransactionsEndpoint,
};
