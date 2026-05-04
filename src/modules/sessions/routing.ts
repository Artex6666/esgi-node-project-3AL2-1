import type { Routing } from "express-zod-api";

import {
  createSessionEndpoint,
  deleteSessionEndpoint,
  getSessionEndpoint,
  listSessionsEndpoint,
  sessionAttendanceEndpoint,
  updateSessionEndpoint,
} from "./endpoints.js";

export const sessionsRouting: Routing = {
  get: listSessionsEndpoint,
  post: createSessionEndpoint,
  ":id": {
    get: getSessionEndpoint,
    put: updateSessionEndpoint,
    delete: deleteSessionEndpoint,
    attendance: sessionAttendanceEndpoint,
  },
};
