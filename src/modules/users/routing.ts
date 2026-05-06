import type { Routing } from "express-zod-api";

import { getUserDetailEndpoint, listUsersEndpoint } from "./endpoints.js";

export const usersRouting: Routing = {
  get: listUsersEndpoint,
  ":id": getUserDetailEndpoint,
};
