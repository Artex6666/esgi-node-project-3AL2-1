import type { Routing } from "express-zod-api";

import { authRouting } from "./modules/auth/routing.js";
import { moviesRouting } from "./modules/movies/routing.js";
import { roomsRouting } from "./modules/rooms/routing.js";
import { sessionsRouting } from "./modules/sessions/routing.js";
import { meEndpoint } from "./modules/users/endpoints.js";
import { usersRouting } from "./modules/users/routing.js";
import { walletRouting } from "./modules/wallet/routing.js";
import { ticketsRouting } from "./modules/tickets/routing.js";
import { statsRouting } from "./modules/stats/routing.js";

export const routing: Routing = {
  v1: {
    auth: authRouting,
    me: meEndpoint,
    users: usersRouting,
    movies: moviesRouting,
    rooms: roomsRouting,
    sessions: sessionsRouting,
    wallet: walletRouting,
    tickets: ticketsRouting,

    stats: statsRouting,
  },
};
