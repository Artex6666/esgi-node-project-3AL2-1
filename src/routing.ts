import type { Routing } from "express-zod-api";

import { authRouting } from "./modules/auth/routing.js";
import { moviesRouting } from "./modules/movies/routing.js";
import { roomsRouting } from "./modules/rooms/routing.js";
import { sessionsRouting } from "./modules/sessions/routing.js";
import { meEndpoint } from "./modules/users/endpoints.js";

export const routing: Routing = {
  v1: {
    auth: authRouting,
    me: meEndpoint,
    movies: moviesRouting,
    rooms: roomsRouting,
    sessions: sessionsRouting,
  },
};
