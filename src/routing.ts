import type { Routing } from "express-zod-api";

import { authRouting } from "./modules/auth/routing.js";
import { moviesRouting } from "./modules/movies/routing.js";
import { roomsRouting } from "./modules/rooms/routing.js";
import { sessionsRouting } from "./modules/sessions/routing.js";
import { meEndpoint } from "./modules/users/endpoints.js";
import { walletRouting } from "./modules/wallet/routing.js";
import { buyTicketEndpoint, getMyTicketsEndpoint, getMyTicketUsagesEndpoint, useTicketEndpoint } from "./modules/tickets/endpoints.js";
import { getAttendanceStatsEndpoint, getDailyStatsEndpoint, getSessionStatsEndpoint, getWeeklyStatsEndpoint } from "./modules/stats/endpoints.js";

export const routing: Routing = {
  v1: {
    auth: authRouting,
    me: meEndpoint,
    movies: moviesRouting,
    rooms: roomsRouting,
    sessions: sessionsRouting,
    wallet: walletRouting,
    tickets: {
      "": getMyTicketsEndpoint,
      buy: buyTicketEndpoint,
      use: useTicketEndpoint,
      usages: getMyTicketUsagesEndpoint,
    },

    stats: {
      attendance: getAttendanceStatsEndpoint,
      daily: getDailyStatsEndpoint,
      weekly: getWeeklyStatsEndpoint,
      sessions: {
        ":id": getSessionStatsEndpoint,
      },
    },
  },
};
