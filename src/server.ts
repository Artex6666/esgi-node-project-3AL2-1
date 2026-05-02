import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "cinema-api listening");
});

const shutdown = (signal: NodeJS.Signals) => {
  logger.info({ signal }, "shutdown signal received");
  server.close((err) => {
    if (err) {
      logger.error({ err }, "error during server close");
    }
    void prisma.$disconnect().finally(() => process.exit(err ? 1 : 0));
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
