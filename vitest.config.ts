import { defineConfig } from "vitest/config";

// NixOS / some Linux setups need an explicit engine binary path; on other
// platforms Prisma's native auto-detection works (and the debian binary
// isn't even downloaded on Windows/macOS).
const linuxEngineEnv =
  process.platform === "linux"
    ? {
        PRISMA_SCHEMA_ENGINE_BINARY: "node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x",
        PRISMA_QUERY_ENGINE_LIBRARY: "node_modules/@prisma/engines/libquery_engine-debian-openssl-3.0.x.so.node",
      }
    : {};

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      PORT: "3001",
      PUBLIC_URL: "http://localhost",
      DATABASE_URL: "postgresql://cinema:cinema@localhost:5432/cinema_test?schema=public",
      JWT_SECRET: "test_secret_value_at_least_32_chars_long_xxxxxxxxxxxx",
      JWT_ACCESS_TTL_SEC: "300",
      JWT_REFRESH_TTL_SEC: "604800",
      LOG_LEVEL: "error",
      ...linuxEngineEnv,
    },
    globalSetup: "./tests/global-setup.ts",
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 15_000,
  },
});
