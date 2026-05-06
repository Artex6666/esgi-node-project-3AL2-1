import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";
import { seedUser } from "../helpers/auth.js";
import { truncateAll } from "../helpers/db.js";

beforeEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /v1/users", () => {
  it("returns all users for an admin", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await seedUser({ role: "CLIENT", email: "client-a@cinema.test" });
    await seedUser({ role: "CLIENT", email: "client-b@cinema.test" });

    const res = await request(app).get("/v1/users").set("Authorization", authHeader).expect(200);
    expect(res.body.data.items.length).toBe(3);
    expect(res.body.data.items[0]).not.toHaveProperty("passwordHash");
  });

  it("returns 403 for a client", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    await request(app).get("/v1/users").set("Authorization", authHeader).expect(403);
  });

  it("returns 401 without an auth token", async () => {
    await request(app).get("/v1/users").expect(401);
  });
});

describe("GET /v1/users/:id", () => {
  it("returns a user with their cinema activity for an admin", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { user: client } = await seedUser({ role: "CLIENT", email: "client@cinema.test" });

    const movie = await prisma.movie.create({
      data: {
        title: "Test",
        description: "x",
        durationMin: 90,
        genre: "Drama",
        releasedAt: new Date("2024-01-01"),
      },
    });
    const room = await prisma.room.create({
      data: { name: "R1", description: "x", type: "2D", capacity: 20, images: [] },
    });
    const session = await prisma.session.create({
      data: {
        movieId: movie.id,
        roomId: room.id,
        startsAt: new Date("2030-02-04T10:00:00Z"),
        endsAt: new Date("2030-02-04T12:00:00Z"),
        priceCents: 1000,
      },
    });
    const ticket = await prisma.ticket.create({
      data: { userId: client.id, kind: "STANDARD", usesRemaining: 0 },
    });
    await prisma.ticketUsage.create({ data: { ticketId: ticket.id, sessionId: session.id } });
    await prisma.transaction.create({
      data: { userId: client.id, amountCents: 1000, kind: "DEPOSIT" },
    });

    const res = await request(app)
      .get(`/v1/users/${client.id}`)
      .set("Authorization", authHeader)
      .expect(200);
    expect(res.body.data.id).toBe(client.id);
    expect(res.body.data.stats.ticketsCount).toBe(1);
    expect(res.body.data.stats.usagesCount).toBe(1);
    expect(res.body.data.stats.transactionsCount).toBe(1);
    expect(res.body.data.recentUsages).toHaveLength(1);
    expect(res.body.data.recentUsages[0].movie.title).toBe("Test");
  });

  it("returns 404 for an unknown id", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await request(app).get("/v1/users/missing-id").set("Authorization", authHeader).expect(404);
  });

  it("returns 403 for a client", async () => {
    const { authHeader, user } = await seedUser({ role: "CLIENT" });
    await request(app).get(`/v1/users/${user.id}`).set("Authorization", authHeader).expect(403);
  });
});
