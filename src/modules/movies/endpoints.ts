import { adminFactory } from "../../factories/admin.js";
import { authedFactory } from "../../factories/authed.js";
import {
  CreateMovieInputSchema,
  CreateMovieOutputSchema,
  DeleteMovieOutputSchema,
  GetMovieOutputSchema,
  ListMoviesInputSchema,
  ListMoviesOutputSchema,
  MovieIdParamsSchema,
  MoviePlanningInputSchema,
  MoviePlanningOutputSchema,
  UpdateMovieInputSchema,
  UpdateMovieOutputSchema,
} from "./schemas.js";
import { moviesService } from "./service.js";

export const listMoviesEndpoint = authedFactory.build({
  method: "get",
  input: ListMoviesInputSchema,
  output: ListMoviesOutputSchema,
  handler: () => moviesService.list(),
});

export const getMovieEndpoint = authedFactory.build({
  method: "get",
  input: MovieIdParamsSchema,
  output: GetMovieOutputSchema,
  handler: ({ input }) => moviesService.getById(input.id),
});

export const createMovieEndpoint = adminFactory.build({
  method: "post",
  input: CreateMovieInputSchema,
  output: CreateMovieOutputSchema,
  handler: ({ input }) => moviesService.create(input),
});

export const updateMovieEndpoint = adminFactory.build({
  method: "put",
  input: UpdateMovieInputSchema,
  output: UpdateMovieOutputSchema,
  handler: ({ input }) => {
    const { id, ...rest } = input;
    return moviesService.update(id, rest);
  },
});

export const deleteMovieEndpoint = adminFactory.build({
  method: "delete",
  input: MovieIdParamsSchema,
  output: DeleteMovieOutputSchema,
  handler: ({ input }) => moviesService.delete(input.id),
});

export const moviePlanningEndpoint = authedFactory.build({
  method: "get",
  input: MoviePlanningInputSchema,
  output: MoviePlanningOutputSchema,
  handler: ({ input }) => moviesService.planning(input.id, { from: input.from, to: input.to }),
});
