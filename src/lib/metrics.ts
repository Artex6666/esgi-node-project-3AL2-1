import type { RequestHandler } from "express";
import { collectDefaultMetrics, Histogram, register } from "prom-client";

collectDefaultMetrics();

const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const metricsMiddleware: RequestHandler = (req, res, next) => {
  const startNs = process.hrtime.bigint();
  res.on("finish", () => {
    const elapsedSec = Number(process.hrtime.bigint() - startNs) / 1e9;
    const matchedRoute = (req.route as { path?: string } | undefined)?.path;
    const route = matchedRoute ?? `${req.baseUrl}${req.path}`;
    httpRequestDuration
      .labels({ method: req.method, route, status: String(res.statusCode) })
      .observe(elapsedSec);
  });
  next();
};

export const metricsHandler: RequestHandler = async (_req, res) => {
  res.setHeader("Content-Type", register.contentType);
  res.send(await register.metrics());
};
