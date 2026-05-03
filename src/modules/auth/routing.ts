import type { Routing } from "express-zod-api";

import { loginEndpoint, logoutEndpoint, refreshEndpoint, registerEndpoint } from "./endpoints.js";

export const authRouting: Routing = {
  register: registerEndpoint,
  login: loginEndpoint,
  refresh: refreshEndpoint,
  logout: logoutEndpoint,
};
