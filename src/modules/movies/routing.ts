import type { Routing } from "express-zod-api";

import { listMoviesEndpoint } from "./endpoints.js";

export const moviesRouting: Routing = {
  "": listMoviesEndpoint,
};
