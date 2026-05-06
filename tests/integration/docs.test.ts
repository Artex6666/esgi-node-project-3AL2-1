import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../src/app.js";

describe("GET /openapi.json", () => {
  it("returns a valid OpenAPI 3 spec", async () => {
    const res = await request(app).get("/openapi.json").expect(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.info.title).toBe("Cinema API");
    expect(res.body.paths["/v1/sessions"]).toBeDefined();
  });
});

describe("GET /docs", () => {
  it("serves the Scalar API reference HTML", async () => {
    const res = await request(app).get("/docs").expect(200);
    expect(res.text).toMatch(/<html/i);
  });
});

describe("GET /metrics", () => {
  it("returns Prometheus exposition format", async () => {
    const res = await request(app).get("/metrics").expect(200);
    expect(res.headers["content-type"]).toMatch(/text\/plain/);
    expect(res.text).toMatch(/process_cpu_seconds_total/);
  });
});
