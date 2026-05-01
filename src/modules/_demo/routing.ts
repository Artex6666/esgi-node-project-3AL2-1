import type { Routing } from "express-zod-api";

import { pingEndpoint } from "./endpoints.js";

export const demoRouting: Routing = {
  ping: pingEndpoint,
};
