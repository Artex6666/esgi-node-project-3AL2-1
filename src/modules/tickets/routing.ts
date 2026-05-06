import type { Routing } from "express-zod-api";

import {
  buyTicketEndpoint,
  listMyTicketUsagesEndpoint,
  listMyTicketsEndpoint,
  useTicketEndpoint,
} from "./endpoints.js";

export const ticketsRouting: Routing = {
  get: listMyTicketsEndpoint,
  buy: buyTicketEndpoint,
  use: useTicketEndpoint,
  usages: listMyTicketUsagesEndpoint,
};
