import { baseFactory } from "../../factories/base.js";
import { PingInputSchema, PingOutputSchema } from "./schemas.js";

export const pingEndpoint = baseFactory.build({
  method: "get",
  input: PingInputSchema,
  output: PingOutputSchema,
  handler: async ({ input }) => ({
    pong: input.name,
    at: new Date().toISOString(),
  }),
});
