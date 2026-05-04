import { adminFactory } from "../../factories/admin.js";
import { authedFactory } from "../../factories/authed.js";
import {
  AttendanceOutputSchema,
  CreateSessionInputSchema,
  CreateSessionOutputSchema,
  DeleteSessionOutputSchema,
  GetSessionOutputSchema,
  ListSessionsInputSchema,
  ListSessionsOutputSchema,
  SessionIdParamsSchema,
  UpdateSessionInputSchema,
  UpdateSessionOutputSchema,
} from "./schemas.js";
import { sessionsService } from "./service.js";

export const listSessionsEndpoint = authedFactory.build({
  method: "get",
  input: ListSessionsInputSchema,
  output: ListSessionsOutputSchema,
  handler: ({ input }) => sessionsService.list({ from: input.from, to: input.to }),
});

export const getSessionEndpoint = authedFactory.build({
  method: "get",
  input: SessionIdParamsSchema,
  output: GetSessionOutputSchema,
  handler: ({ input }) => sessionsService.getById(input.id),
});

export const createSessionEndpoint = adminFactory.build({
  method: "post",
  input: CreateSessionInputSchema,
  output: CreateSessionOutputSchema,
  handler: ({ input }) => sessionsService.create(input),
});

export const updateSessionEndpoint = adminFactory.build({
  method: "put",
  input: UpdateSessionInputSchema,
  output: UpdateSessionOutputSchema,
  handler: ({ input }) => {
    const { id, ...rest } = input;
    return sessionsService.update(id, rest);
  },
});

export const deleteSessionEndpoint = adminFactory.build({
  method: "delete",
  input: SessionIdParamsSchema,
  output: DeleteSessionOutputSchema,
  handler: ({ input }) => sessionsService.delete(input.id),
});

export const sessionAttendanceEndpoint = adminFactory.build({
  method: "get",
  input: SessionIdParamsSchema,
  output: AttendanceOutputSchema,
  handler: ({ input }) => sessionsService.attendance(input.id),
});
