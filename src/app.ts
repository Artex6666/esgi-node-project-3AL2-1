import { apiReference } from "@scalar/express-api-reference";
import express, { type ErrorRequestHandler } from "express";
import { attachRouting, createConfig, Documentation } from "express-zod-api";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { metricsHandler, metricsMiddleware } from "./lib/metrics.js";
import { routing } from "./routing.js";

export const app = express();

app.use(express.json({ limit: "100kb" }));
app.use(metricsMiddleware);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/metrics", (req, res, next) => {
  void Promise.resolve(metricsHandler(req, res, next)).catch(next);
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

const openApiSpec = JSON.parse(
  new Documentation({
    routing,
    config,
    title: "Cinema API",
    version: "0.1.0",
    serverUrl: env.PUBLIC_URL,
  }).getSpecAsJson(),
) as { paths?: Record<string, Record<string, unknown>> } & Record<string, unknown>;

for (const operations of Object.values(openApiSpec.paths ?? {})) {
  delete operations["head"]; // Remove head methods in the OpenAPI spec
}

app.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

app.use("/docs", apiReference({ url: "/openapi.json" }));

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
