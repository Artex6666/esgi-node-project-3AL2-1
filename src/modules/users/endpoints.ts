import { z } from "zod";

import { adminFactory } from "../../factories/admin.js";
import { authedFactory } from "../../factories/authed.js";
import { PublicUserSchema } from "../auth/schemas.js";
import {
  ListUsersInputSchema,
  ListUsersOutputSchema,
  UserDetailOutputSchema,
  UserIdParamsSchema,
} from "./schemas.js";
import { usersService } from "./service.js";

export const meEndpoint = authedFactory.build({
  method: "get",
  input: z.object({}),
  output: PublicUserSchema,
  handler: ({ ctx }) => usersService.getById(ctx.user.id),
});

export const listUsersEndpoint = adminFactory.build({
  method: "get",
  input: ListUsersInputSchema,
  output: ListUsersOutputSchema,
  handler: () => usersService.listAll(),
});

export const getUserDetailEndpoint = adminFactory.build({
  method: "get",
  input: UserIdParamsSchema,
  output: UserDetailOutputSchema,
  handler: ({ input }) => usersService.getDetailed(input.id),
});
