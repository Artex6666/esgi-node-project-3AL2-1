import { authMiddleware } from "../middlewares/auth.js";
import { baseFactory } from "./base.js";

export const authedFactory = baseFactory.addMiddleware(authMiddleware);
