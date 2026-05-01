import express from "express";
import { attachRouting, createConfig } from "express-zod-api";

import { logger } from "./config/logger.js";
import { routing } from "./routing.js";

export const app = express();

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

export const config = createConfig({
  app,
  cors: false,
  logger,
  inputSources: {
    get: ["query", "params"],
    post: ["body", "params", "files"],
    put: ["body", "params"],
    patch: ["body", "params"],
    delete: ["query", "params"],
  },
});

const { notFoundHandler } = attachRouting(config, routing);

app.use(notFoundHandler);
