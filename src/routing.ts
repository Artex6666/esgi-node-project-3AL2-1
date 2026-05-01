import type { Routing } from "express-zod-api";

import { demoRouting } from "./modules/_demo/routing.js";

export const routing: Routing = {
  v1: {
    ...demoRouting,
  },
};
