import { requireRole } from "../middlewares/role.js";
import { authedFactory } from "./authed.js";

export const adminFactory = authedFactory.addMiddleware(requireRole("ADMIN", "SUPER_ADMIN"));
