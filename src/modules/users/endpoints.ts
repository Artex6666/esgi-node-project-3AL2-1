import { authedFactory } from "../../factories/authed.js";
import { PublicUserSchema } from "../auth/schemas.js";
import { usersService } from "./service.js";

export const meEndpoint = authedFactory.build({
  method: "get",
  output: PublicUserSchema,
  handler: ({ ctx }) => usersService.getById(ctx.user.id),
});
