import { authedFactory } from "../../factories/authed.js";
import { baseFactory } from "../../factories/base.js";
import {
  AuthResponseSchema,
  CredentialsSchema,
  LogoutOutputSchema,
  RefreshInputSchema,
  RefreshOutputSchema,
} from "./schemas.js";
import { authService } from "./service.js";

export const registerEndpoint = baseFactory.build({
  method: "post",
  input: CredentialsSchema,
  output: AuthResponseSchema,
  handler: ({ input }) => authService.register(input.email, input.password),
});

export const loginEndpoint = baseFactory.build({
  method: "post",
  input: CredentialsSchema,
  output: AuthResponseSchema,
  handler: ({ input }) => authService.login(input.email, input.password),
});

export const refreshEndpoint = baseFactory.build({
  method: "post",
  input: RefreshInputSchema,
  output: RefreshOutputSchema,
  handler: ({ input }) => authService.refresh(input.refreshToken),
});

export const logoutEndpoint = authedFactory.build({
  method: "post",
  input: RefreshInputSchema.partial(),
  output: LogoutOutputSchema,
  handler: ({ ctx }) => authService.logout(ctx.user.id),
});
