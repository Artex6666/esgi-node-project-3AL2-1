import argon2 from "argon2";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";
import { truncateAll } from "../helpers/db.js";

beforeEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const seedClient = async (email = "alice@cinema.test", password = "alice12345") => {
  const passwordHash = await argon2.hash(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  return { user, password };
};

describe("POST /v1/auth/register", () => {
  it("creates a CLIENT user and returns access + refresh tokens", async () => {
    const res = await request(app)
      .post("/v1/auth/register")
      .send({ email: "new@cinema.test", password: "newpassword" })
      .expect(200);

    expect(res.body.status).toBe("success");
    expect(res.body.data.user.email).toBe("new@cinema.test");
    expect(res.body.data.user.role).toBe("CLIENT");
    expect(res.body.data.user.balanceCents).toBe(0);
    expect(typeof res.body.data.tokens.accessToken).toBe("string");
    expect(typeof res.body.data.tokens.refreshToken).toBe("string");

    const inDb = await prisma.user.findUnique({ where: { email: "new@cinema.test" } });
    expect(inDb).not.toBeNull();
    expect(inDb!.passwordHash).not.toBe("newpassword");
  });

  it("rejects an already-registered email with 409", async () => {
    await seedClient("dup@cinema.test");
    const res = await request(app)
      .post("/v1/auth/register")
      .send({ email: "dup@cinema.test", password: "anotherpw" })
      .expect(409);
    expect(res.body.error.message).toMatch(/already registered/i);
  });

  it("rejects passwords shorter than 8 characters with 400", async () => {
    const res = await request(app)
      .post("/v1/auth/register")
      .send({ email: "a@cinema.test", password: "short" })
      .expect(400);
    expect(res.body.error.message).toMatch(/password/i);
  });
});

describe("POST /v1/auth/login", () => {
  it("returns tokens on valid credentials", async () => {
    const { password } = await seedClient();
    const res = await request(app).post("/v1/auth/login").send({ email: "alice@cinema.test", password }).expect(200);
    expect(res.body.data.tokens.accessToken.length).toBeGreaterThan(0);
  });

  it("returns 401 on wrong password", async () => {
    await seedClient();
    const res = await request(app)
      .post("/v1/auth/login")
      .send({ email: "alice@cinema.test", password: "wrongpassword" })
      .expect(401);
    expect(res.body.error.message).toMatch(/invalid credentials/i);
  });

  it("returns 401 for unknown email", async () => {
    await request(app).post("/v1/auth/login").send({ email: "ghost@cinema.test", password: "whatever1" }).expect(401);
  });
});

describe("POST /v1/auth/refresh", () => {
  it("rotates the refresh token and invalidates the old one", async () => {
    const { password } = await seedClient();
    const login = await request(app).post("/v1/auth/login").send({ email: "alice@cinema.test", password }).expect(200);
    const oldRefresh = login.body.data.tokens.refreshToken;

    const rotate = await request(app).post("/v1/auth/refresh").send({ refreshToken: oldRefresh }).expect(200);
    const newRefresh = rotate.body.data.tokens.refreshToken;
    expect(newRefresh).not.toBe(oldRefresh);

    await request(app).post("/v1/auth/refresh").send({ refreshToken: oldRefresh }).expect(401);

    await request(app).post("/v1/auth/refresh").send({ refreshToken: newRefresh }).expect(200);
  });

  it("rejects an unknown refresh token with 401", async () => {
    await request(app)
      .post("/v1/auth/refresh")
      .send({ refreshToken: "deadbeef".repeat(8) })
      .expect(401);
  });
});

describe("POST /v1/auth/logout", () => {
  it("revokes all of the user's refresh tokens", async () => {
    const { user, password } = await seedClient();
    const login = await request(app).post("/v1/auth/login").send({ email: user.email, password }).expect(200);
    const accessToken = login.body.data.tokens.accessToken;
    const refreshToken = login.body.data.tokens.refreshToken;

    await request(app).post("/v1/auth/logout").set("Authorization", `Bearer ${accessToken}`).send({}).expect(200);

    await request(app).post("/v1/auth/refresh").send({ refreshToken }).expect(401);

    const live = await prisma.refreshToken.count({ where: { userId: user.id, revokedAt: null } });
    expect(live).toBe(0);
  });

  it("returns 401 without a Bearer token", async () => {
    await request(app).post("/v1/auth/logout").send({}).expect(401);
  });
});

describe("GET /v1/me", () => {
  it("returns the authenticated user's public profile", async () => {
    const { user, password } = await seedClient();
    const login = await request(app).post("/v1/auth/login").send({ email: user.email, password }).expect(200);

    const me = await request(app)
      .get("/v1/me")
      .set("Authorization", `Bearer ${login.body.data.tokens.accessToken}`)
      .expect(200);

    expect(me.body.data.id).toBe(user.id);
    expect(me.body.data.email).toBe(user.email);
    expect(me.body.data.role).toBe("CLIENT");
    expect(me.body.data).not.toHaveProperty("passwordHash");
  });

  it("returns 401 without a token", async () => {
    await request(app).get("/v1/me").expect(401);
  });

  it("returns 401 with a malformed token", async () => {
    await request(app).get("/v1/me").set("Authorization", "Bearer not-a-jwt").expect(401);
  });
});
