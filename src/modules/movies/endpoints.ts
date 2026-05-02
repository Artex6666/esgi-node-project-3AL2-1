import { baseFactory } from "../../factories/base.js";
import { ListMoviesInputSchema, ListMoviesOutputSchema } from "./schemas.js";
import { moviesService } from "./service.js";

export const listMoviesEndpoint = baseFactory.build({
  method: "get",
  input: ListMoviesInputSchema,
  output: ListMoviesOutputSchema,
  handler: () => moviesService.list(),
});
