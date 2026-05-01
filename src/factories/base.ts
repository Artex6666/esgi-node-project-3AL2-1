import { EndpointsFactory, defaultResultHandler } from "express-zod-api";

export const baseFactory = new EndpointsFactory(defaultResultHandler);
