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

const validRoom = {
  name: "Salle Test",
  description: "Une salle pour les tests",
  images: [],
  type: "2D",
  capacity: 20,
  accessible: true,
};

describe("GET /v1/rooms", () => {
  it("lists all rooms ordered by name for an authenticated user", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    await prisma.room.createMany({
      data: [
        { ...validRoom, name: "Salle B" },
        { ...validRoom, name: "Salle A" },
      ],
    });

    const res = await request(app).get("/v1/rooms").set("Authorization", authHeader).expect(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.items[0].name).toBe("Salle A");
    expect(res.body.data.items[1].name).toBe("Salle B");
  });

  it("returns 401 without an auth token", async () => {
    await request(app).get("/v1/rooms").expect(401);
  });
});

describe("GET /v1/rooms/:id", () => {
  it("returns a single room", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const created = await prisma.room.create({ data: validRoom });

    const res = await request(app).get(`/v1/rooms/${created.id}`).set("Authorization", authHeader).expect(200);
    expect(res.body.data.id).toBe(created.id);
    expect(res.body.data.name).toBe(validRoom.name);
    expect(res.body.data.underMaintenance).toBe(false);
  });

  it("returns 404 for an unknown id", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const res = await request(app).get("/v1/rooms/does-not-exist").set("Authorization", authHeader).expect(404);
    expect(res.body.error.message).toMatch(/not found/i);
  });
});

describe("POST /v1/rooms", () => {
  it("creates a room when called by an admin", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const res = await request(app).post("/v1/rooms").set("Authorization", authHeader).send(validRoom).expect(200);

    expect(res.body.data.name).toBe(validRoom.name);
    expect(res.body.data.id).toBeTruthy();
    expect(res.body.data.underMaintenance).toBe(false);

    const inDb = await prisma.room.findUnique({ where: { id: res.body.data.id } });
    expect(inDb).not.toBeNull();
  });

  it("creates a room when called by a super-admin", async () => {
    const { authHeader } = await seedUser({ role: "SUPER_ADMIN" });
    await request(app).post("/v1/rooms").set("Authorization", authHeader).send(validRoom).expect(200);
  });

  it("returns 403 when called by a regular client", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    await request(app).post("/v1/rooms").set("Authorization", authHeader).send(validRoom).expect(403);
  });

  it("returns 401 with no token", async () => {
    await request(app).post("/v1/rooms").send(validRoom).expect(401);
  });

  it("returns 400 when capacity is below the minimum (15)", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await request(app)
      .post("/v1/rooms")
      .set("Authorization", authHeader)
      .send({ ...validRoom, capacity: 10 })
      .expect(400);
  });

  it("returns 400 when capacity exceeds the maximum (30)", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await request(app)
      .post("/v1/rooms")
      .set("Authorization", authHeader)
      .send({ ...validRoom, capacity: 31 })
      .expect(400);
  });

  it("returns 400 when required fields are missing", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await request(app).post("/v1/rooms").set("Authorization", authHeader).send({ name: "Only name" }).expect(400);
  });

  it("returns 409 when the name is already taken", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await prisma.room.create({ data: validRoom });
    await request(app).post("/v1/rooms").set("Authorization", authHeader).send(validRoom).expect(409);
  });

  it("defaults images to empty array and accessible to false when omitted", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const res = await request(app)
      .post("/v1/rooms")
      .set("Authorization", authHeader)
      .send({
        name: "Salle minimal",
        description: "minimum",
        type: "2D",
        capacity: 18,
      })
      .expect(200);
    expect(res.body.data.images).toEqual([]);
    expect(res.body.data.accessible).toBe(false);
  });
});

describe("PUT /v1/rooms/:id", () => {
  it("updates a room when called by an admin", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const created = await prisma.room.create({ data: validRoom });

    const res = await request(app)
      .put(`/v1/rooms/${created.id}`)
      .set("Authorization", authHeader)
      .send({ description: "Renommée", capacity: 25 })
      .expect(200);

    expect(res.body.data.description).toBe("Renommée");
    expect(res.body.data.capacity).toBe(25);
    expect(res.body.data.name).toBe(validRoom.name); // unchanged
  });

  it("returns 404 when the room does not exist", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await request(app)
      .put("/v1/rooms/missing-id")
      .set("Authorization", authHeader)
      .send({ description: "ignored" })
      .expect(404);
  });

  it("returns 403 when called by a client", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const created = await prisma.room.create({ data: validRoom });
    await request(app)
      .put(`/v1/rooms/${created.id}`)
      .set("Authorization", authHeader)
      .send({ description: "nope" })
      .expect(403);
  });

  it("returns 400 when capacity is out of bounds", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const created = await prisma.room.create({ data: validRoom });
    await request(app)
      .put(`/v1/rooms/${created.id}`)
      .set("Authorization", authHeader)
      .send({ capacity: 50 })
      .expect(400);
  });
});

describe("DELETE /v1/rooms/:id", () => {
  it("deletes a room when called by an admin", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const created = await prisma.room.create({ data: validRoom });

    await request(app).delete(`/v1/rooms/${created.id}`).set("Authorization", authHeader).expect(200);

    const stillThere = await prisma.room.findUnique({ where: { id: created.id } });
    expect(stillThere).toBeNull();
  });

  it("returns 409 when the room still has scheduled sessions", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const room = await prisma.room.create({ data: validRoom });
    const movie = await prisma.movie.create({
      data: {
        title: "Film",
        description: "Synopsis",
        durationMin: 90,
        genre: "Drame",
        releasedAt: new Date("2024-01-15T00:00:00.000Z"),
      },
    });
    await prisma.session.create({
      data: {
        movieId: movie.id,
        roomId: room.id,
        startsAt: new Date("2030-01-01T10:00:00Z"),
        endsAt: new Date("2030-01-01T12:30:00Z"),
        priceCents: 1000,
      },
    });

    await request(app).delete(`/v1/rooms/${room.id}`).set("Authorization", authHeader).expect(409);
  });

  it("returns 404 when the room does not exist", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await request(app).delete("/v1/rooms/missing-id").set("Authorization", authHeader).expect(404);
  });

  it("returns 403 when called by a client", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const created = await prisma.room.create({ data: validRoom });
    await request(app).delete(`/v1/rooms/${created.id}`).set("Authorization", authHeader).expect(403);
  });
});

describe("PATCH /v1/rooms/:id/maintenance", () => {
  it("toggles a room into maintenance when called by an admin", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const created = await prisma.room.create({ data: validRoom });

    const res = await request(app)
      .patch(`/v1/rooms/${created.id}/maintenance`)
      .set("Authorization", authHeader)
      .send({ underMaintenance: true })
      .expect(200);

    expect(res.body.data.underMaintenance).toBe(true);
    const inDb = await prisma.room.findUnique({ where: { id: created.id } });
    expect(inDb?.underMaintenance).toBe(true);
  });

  it("toggles a room out of maintenance", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const created = await prisma.room.create({ data: { ...validRoom, underMaintenance: true } });

    const res = await request(app)
      .patch(`/v1/rooms/${created.id}/maintenance`)
      .set("Authorization", authHeader)
      .send({ underMaintenance: false })
      .expect(200);

    expect(res.body.data.underMaintenance).toBe(false);
  });

  it("returns 403 when called by a client", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const created = await prisma.room.create({ data: validRoom });
    await request(app)
      .patch(`/v1/rooms/${created.id}/maintenance`)
      .set("Authorization", authHeader)
      .send({ underMaintenance: true })
      .expect(403);
  });

  it("returns 404 when the room does not exist", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await request(app)
      .patch("/v1/rooms/missing-id/maintenance")
      .set("Authorization", authHeader)
      .send({ underMaintenance: true })
      .expect(404);
  });

  it("returns 400 when the body is missing the flag", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const created = await prisma.room.create({ data: validRoom });
    await request(app)
      .patch(`/v1/rooms/${created.id}/maintenance`)
      .set("Authorization", authHeader)
      .send({})
      .expect(400);
  });
});

describe("GET /v1/rooms/:id/planning", () => {
  const validMovie = {
    title: "Planning Movie",
    description: "Synopsis",
    durationMin: 120,
    genre: "Drame",
    releasedAt: new Date("2024-01-15T00:00:00.000Z"),
  };

  it("returns sessions for the room ordered by start time", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const room = await prisma.room.create({ data: validRoom });
    const movie = await prisma.movie.create({ data: validMovie });
    await prisma.session.createMany({
      data: [
        {
          movieId: movie.id,
          roomId: room.id,
          startsAt: new Date("2030-02-01T13:00:00Z"),
          endsAt: new Date("2030-02-01T15:30:00Z"),
          priceCents: 1000,
        },
        {
          movieId: movie.id,
          roomId: room.id,
          startsAt: new Date("2030-02-01T10:00:00Z"),
          endsAt: new Date("2030-02-01T12:30:00Z"),
          priceCents: 1000,
        },
      ],
    });

    const res = await request(app).get(`/v1/rooms/${room.id}/planning`).set("Authorization", authHeader).expect(200);
    expect(res.body.data.roomId).toBe(room.id);
    expect(res.body.data.items).toHaveLength(2);
    expect(new Date(res.body.data.items[0].startsAt).getTime()).toBeLessThan(
      new Date(res.body.data.items[1].startsAt).getTime(),
    );
    expect(res.body.data.items[0].movie.title).toBe(validMovie.title);
  });

  it("filters by date range when from/to are given", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const room = await prisma.room.create({ data: validRoom });
    const movie = await prisma.movie.create({ data: validMovie });
    await prisma.session.createMany({
      data: [
        {
          movieId: movie.id,
          roomId: room.id,
          startsAt: new Date("2030-03-01T10:00:00Z"),
          endsAt: new Date("2030-03-01T12:30:00Z"),
          priceCents: 1000,
        },
        {
          movieId: movie.id,
          roomId: room.id,
          startsAt: new Date("2030-04-01T10:00:00Z"),
          endsAt: new Date("2030-04-01T12:30:00Z"),
          priceCents: 1000,
        },
      ],
    });

    const res = await request(app)
      .get(`/v1/rooms/${room.id}/planning`)
      .set("Authorization", authHeader)
      .query({ from: "2030-03-15T00:00:00.000Z" })
      .expect(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(new Date(res.body.data.items[0].startsAt).getMonth()).toBe(3); // April (0-indexed)
  });

  it("returns an empty list when the room is under maintenance", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const room = await prisma.room.create({ data: { ...validRoom, underMaintenance: true } });
    const movie = await prisma.movie.create({ data: validMovie });
    await prisma.session.create({
      data: {
        movieId: movie.id,
        roomId: room.id,
        startsAt: new Date("2030-05-01T10:00:00Z"),
        endsAt: new Date("2030-05-01T12:30:00Z"),
        priceCents: 1000,
      },
    });

    const res = await request(app).get(`/v1/rooms/${room.id}/planning`).set("Authorization", authHeader).expect(200);
    expect(res.body.data.items).toEqual([]);
  });

  it("returns 401 without an auth token", async () => {
    const room = await prisma.room.create({ data: validRoom });
    await request(app).get(`/v1/rooms/${room.id}/planning`).expect(401);
  });

  it("returns 404 if the room does not exist", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    await request(app).get("/v1/rooms/missing-id/planning").set("Authorization", authHeader).expect(404);
  });
});
