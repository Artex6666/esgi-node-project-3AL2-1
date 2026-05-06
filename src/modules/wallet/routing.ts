import type { Routing } from "express-zod-api";

import {
  depositEndpoint,
  getWalletEndpoint,
  listMyTransactionsEndpoint,
  withdrawEndpoint,
} from "./endpoints.js";

export const walletRouting: Routing = {
  get: getWalletEndpoint,
  deposit: depositEndpoint,
  withdraw: withdrawEndpoint,
  transactions: listMyTransactionsEndpoint,
};
