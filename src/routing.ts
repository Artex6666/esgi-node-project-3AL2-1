import type { Routing } from "express-zod-api";

import { moviesRouting } from "./modules/movies/routing.js";

export const routing: Routing = {
  v1: {
    movies: moviesRouting,
  },
};
