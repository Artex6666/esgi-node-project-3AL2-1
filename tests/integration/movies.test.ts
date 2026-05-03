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

const validMovie = {
  title: "Test Movie",
  description: "A wonderful test movie.",
  durationMin: 120,
  genre: "Drama",
  releasedAt: "2024-01-15T00:00:00.000Z",
};

describe("GET /v1/movies", () => {
  it("lists all movies (public, no auth required)", async () => {
    await prisma.movie.create({
      data: { ...validMovie, releasedAt: new Date(validMovie.releasedAt) },
    });
    const res = await request(app).get("/v1/movies").expect(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].title).toBe(validMovie.title);
  });

  it("returns an empty list when no movies exist", async () => {
    const res = await request(app).get("/v1/movies").expect(200);
    expect(res.body.data.items).toEqual([]);
  });
});

describe("GET /v1/movies/:id", () => {
  it("returns a single movie", async () => {
    const created = await prisma.movie.create({
      data: { ...validMovie, releasedAt: new Date(validMovie.releasedAt) },
    });
    const res = await request(app).get(`/v1/movies/${created.id}`).expect(200);
    expect(res.body.data.id).toBe(created.id);
    expect(res.body.data.title).toBe(validMovie.title);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).get("/v1/movies/does-not-exist").expect(404);
    expect(res.body.error.message).toMatch(/not found/i);
  });
});

describe("POST /v1/movies", () => {
  it("creates a movie when called by an admin", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const res = await request(app).post("/v1/movies").set("Authorization", authHeader).send(validMovie).expect(200);
    expect(res.body.data.title).toBe(validMovie.title);
    expect(res.body.data.id).toBeTruthy();

    const inDb = await prisma.movie.findUnique({ where: { id: res.body.data.id } });
    expect(inDb).not.toBeNull();
  });

  it("creates a movie when called by a super-admin", async () => {
    const { authHeader } = await seedUser({ role: "SUPER_ADMIN" });
    await request(app).post("/v1/movies").set("Authorization", authHeader).send(validMovie).expect(200);
  });

  it("returns 403 when called by a regular client", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    await request(app).post("/v1/movies").set("Authorization", authHeader).send(validMovie).expect(403);
  });

  it("returns 401 with no token", async () => {
    await request(app).post("/v1/movies").send(validMovie).expect(401);
  });

  it("returns 400 when required fields are missing", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await request(app).post("/v1/movies").set("Authorization", authHeader).send({ title: "Only title" }).expect(400);
  });

  it("returns 400 when durationMin is not positive", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await request(app)
      .post("/v1/movies")
      .set("Authorization", authHeader)
      .send({ ...validMovie, durationMin: 0 })
      .expect(400);
  });
});

describe("PUT /v1/movies/:id", () => {
  it("updates a movie when called by an admin", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const created = await prisma.movie.create({
      data: { ...validMovie, releasedAt: new Date(validMovie.releasedAt) },
    });

    const res = await request(app)
      .put(`/v1/movies/${created.id}`)
      .set("Authorization", authHeader)
      .send({ title: "Renamed", durationMin: 100 })
      .expect(200);

    expect(res.body.data.title).toBe("Renamed");
    expect(res.body.data.durationMin).toBe(100);
    expect(res.body.data.genre).toBe(validMovie.genre); // unchanged
  });

  it("returns 404 when the movie does not exist", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await request(app)
      .put("/v1/movies/missing-id")
      .set("Authorization", authHeader)
      .send({ title: "ignored" })
      .expect(404);
  });

  it("returns 403 when called by a client", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const created = await prisma.movie.create({
      data: { ...validMovie, releasedAt: new Date(validMovie.releasedAt) },
    });
    await request(app)
      .put(`/v1/movies/${created.id}`)
      .set("Authorization", authHeader)
      .send({ title: "nope" })
      .expect(403);
  });
});

describe("DELETE /v1/movies/:id", () => {
  it("deletes a movie when called by an admin", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const created = await prisma.movie.create({
      data: { ...validMovie, releasedAt: new Date(validMovie.releasedAt) },
    });
    await request(app).delete(`/v1/movies/${created.id}`).set("Authorization", authHeader).expect(200);

    const stillThere = await prisma.movie.findUnique({ where: { id: created.id } });
    expect(stillThere).toBeNull();
  });

  it("returns 409 when the movie still has scheduled sessions", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const movie = await prisma.movie.create({
      data: { ...validMovie, releasedAt: new Date(validMovie.releasedAt) },
    });
    const room = await prisma.room.create({
      data: { name: "Salle test", description: "x", type: "2D", capacity: 20, images: [] },
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

    await request(app).delete(`/v1/movies/${movie.id}`).set("Authorization", authHeader).expect(409);
  });

  it("returns 404 when the movie does not exist", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await request(app).delete("/v1/movies/missing-id").set("Authorization", authHeader).expect(404);
  });
});

describe("GET /v1/movies/:id/planning", () => {
  it("returns sessions for the movie ordered by start time", async () => {
    const movie = await prisma.movie.create({
      data: { ...validMovie, releasedAt: new Date(validMovie.releasedAt) },
    });
    const room = await prisma.room.create({
      data: { name: "Salle planning", description: "x", type: "2D", capacity: 20, images: [] },
    });
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

    const res = await request(app).get(`/v1/movies/${movie.id}/planning`).expect(200);
    expect(res.body.data.movieId).toBe(movie.id);
    expect(res.body.data.items).toHaveLength(2);
    expect(new Date(res.body.data.items[0].startsAt).getTime()).toBeLessThan(
      new Date(res.body.data.items[1].startsAt).getTime(),
    );
    expect(res.body.data.items[0].room.name).toBe("Salle planning");
  });

  it("filters by date range when from/to are given", async () => {
    const movie = await prisma.movie.create({
      data: { ...validMovie, releasedAt: new Date(validMovie.releasedAt) },
    });
    const room = await prisma.room.create({
      data: { name: "Salle range", description: "x", type: "2D", capacity: 20, images: [] },
    });
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
      .get(`/v1/movies/${movie.id}/planning`)
      .query({ from: "2030-03-15T00:00:00.000Z" })
      .expect(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(new Date(res.body.data.items[0].startsAt).getMonth()).toBe(3); // April (0-indexed)
  });

  it("excludes sessions in rooms under maintenance", async () => {
    const movie = await prisma.movie.create({
      data: { ...validMovie, releasedAt: new Date(validMovie.releasedAt) },
    });
    const goodRoom = await prisma.room.create({
      data: { name: "Salle ok", description: "x", type: "2D", capacity: 20, images: [] },
    });
    const brokenRoom = await prisma.room.create({
      data: {
        name: "Salle hs",
        description: "x",
        type: "2D",
        capacity: 20,
        images: [],
        underMaintenance: true,
      },
    });
    await prisma.session.createMany({
      data: [
        {
          movieId: movie.id,
          roomId: goodRoom.id,
          startsAt: new Date("2030-05-01T10:00:00Z"),
          endsAt: new Date("2030-05-01T12:30:00Z"),
          priceCents: 1000,
        },
        {
          movieId: movie.id,
          roomId: brokenRoom.id,
          startsAt: new Date("2030-05-01T13:00:00Z"),
          endsAt: new Date("2030-05-01T15:30:00Z"),
          priceCents: 1000,
        },
      ],
    });

    const res = await request(app).get(`/v1/movies/${movie.id}/planning`).expect(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].room.name).toBe("Salle ok");
  });

  it("returns 404 if the movie does not exist", async () => {
    await request(app).get("/v1/movies/missing-id/planning").expect(404);
  });
});
