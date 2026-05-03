import type { Routing } from "express-zod-api";

import {
  createMovieEndpoint,
  deleteMovieEndpoint,
  getMovieEndpoint,
  listMoviesEndpoint,
  moviePlanningEndpoint,
  updateMovieEndpoint,
} from "./endpoints.js";

export const moviesRouting: Routing = {
  get: listMoviesEndpoint,
  post: createMovieEndpoint,
  ":id": {
    get: getMovieEndpoint,
    put: updateMovieEndpoint,
    delete: deleteMovieEndpoint,
    planning: moviePlanningEndpoint,
  },
};
