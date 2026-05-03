import { execSync } from "node:child_process";

import { Client } from "pg";

const ADMIN_URL = "postgresql://cinema:cinema@localhost:5432/postgres";
const TEST_DB = "cinema_test";
const TEST_DATABASE_URL = `postgresql://cinema:cinema@localhost:5432/${TEST_DB}?schema=public`;

const ENGINE_ENV = {
  PRISMA_SCHEMA_ENGINE_BINARY: "node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x",
  PRISMA_QUERY_ENGINE_LIBRARY: "node_modules/@prisma/engines/libquery_engine-debian-openssl-3.0.x.so.node",
};

async function ensureDatabase() {
  const client = new Client({ connectionString: ADMIN_URL });
  await client.connect();
  try {
    const exists = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [TEST_DB]);
    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE "${TEST_DB}"`);
    }
  } finally {
    await client.end();
  }
}

export async function setup() {
  await ensureDatabase();
  execSync("prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, ...ENGINE_ENV, DATABASE_URL: TEST_DATABASE_URL },
  });
}

export function teardown() {
  // Leave the test DB in place so re-runs are fast and developers can
  // inspect leftover state if a test fails.
}
