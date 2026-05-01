import express, { type ErrorRequestHandler } from "express";
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

const jsonErrorHandler: ErrorRequestHandler = (err: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  const status =
    err && typeof err === "object" && "statusCode" in err && typeof err.statusCode === "number" ? err.statusCode : 500;
  const message =
    err && typeof err === "object" && "message" in err && typeof err.message === "string"
      ? err.message
      : "Internal Server Error";
  res.status(status).json({ status: "error", error: { message } });
};

app.use(jsonErrorHandler);
