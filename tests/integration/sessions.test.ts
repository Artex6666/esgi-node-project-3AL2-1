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

// 2030-02-04 is a Monday in UTC; 2030-02-09 = Saturday, 2030-02-10 = Sunday.
const MON_10H = new Date("2030-02-04T10:00:00.000Z");
const MON_12H = new Date("2030-02-04T12:00:00.000Z");
const MON_12H30 = new Date("2030-02-04T12:30:00.000Z");
const MON_14H = new Date("2030-02-04T14:00:00.000Z");
const MON_15H = new Date("2030-02-04T15:00:00.000Z");
const SAT_10H = new Date("2030-02-09T10:00:00.000Z");
const SAT_12H = new Date("2030-02-09T12:00:00.000Z");
const SUN_10H = new Date("2030-02-10T10:00:00.000Z");
const SUN_12H = new Date("2030-02-10T12:00:00.000Z");

const baseMovie = (overrides: Partial<{ title: string; durationMin: number }> = {}) => ({
  title: "Test Movie",
  description: "Synopsis",
  durationMin: 90,
  genre: "Drama",
  releasedAt: new Date("2024-01-15T00:00:00.000Z"),
  ...overrides,
});

const baseRoom = (overrides: Partial<{ name: string; underMaintenance: boolean }> = {}) => ({
  name: `Salle ${crypto.randomUUID().slice(0, 8)}`,
  description: "x",
  type: "2D",
  capacity: 20,
  images: [],
  ...overrides,
});

const seedMovieAndRoom = async () => {
  const movie = await prisma.movie.create({ data: baseMovie() });
  const room = await prisma.room.create({ data: baseRoom() });
  return { movie, room };
};

const validSession = (movieId: string, roomId: string) => ({
  movieId,
  roomId,
  startsAt: MON_10H.toISOString(),
  endsAt: MON_12H.toISOString(), // 120 min, movie is 90 → 90 + 30 boundary
  priceCents: 1000,
});

describe("POST /v1/sessions", () => {
  it("creates a session when called by an admin with valid data", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();

    const res = await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send(validSession(movie.id, room.id))
      .expect(200);

    expect(res.body.data.id).toBeTruthy();
    expect(res.body.data.movie.title).toBe("Test Movie");
    expect(res.body.data.room.id).toBe(room.id);
  });

  it("returns 403 for a regular client", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const { movie, room } = await seedMovieAndRoom();
    await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send(validSession(movie.id, room.id))
      .expect(403);
  });

  it("returns 401 without token", async () => {
    const { movie, room } = await seedMovieAndRoom();
    await request(app).post("/v1/sessions").send(validSession(movie.id, room.id)).expect(401);
  });

  it("returns 400 when required fields are missing", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await request(app).post("/v1/sessions").set("Authorization", authHeader).send({}).expect(400);
  });

  it("returns 404 when movieId does not exist", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const room = await prisma.room.create({ data: baseRoom() });
    await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send(validSession("missing-movie", room.id))
      .expect(404);
  });

  it("returns 404 when roomId does not exist", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const movie = await prisma.movie.create({ data: baseMovie() });
    await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send(validSession(movie.id, "missing-room"))
      .expect(404);
  });

  it("returns 422 when the room is under maintenance", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const movie = await prisma.movie.create({ data: baseMovie() });
    const room = await prisma.room.create({ data: baseRoom({ underMaintenance: true }) });
    await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send(validSession(movie.id, room.id))
      .expect(422);
  });
});

describe("POST /v1/sessions — business hours", () => {
  it("returns 422 on a Saturday", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();
    await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send({
        movieId: movie.id,
        roomId: room.id,
        startsAt: SAT_10H.toISOString(),
        endsAt: SAT_12H.toISOString(),
        priceCents: 1000,
      })
      .expect(422);
  });

  it("returns 422 on a Sunday", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();
    await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send({
        movieId: movie.id,
        roomId: room.id,
        startsAt: SUN_10H.toISOString(),
        endsAt: SUN_12H.toISOString(),
        priceCents: 1000,
      })
      .expect(422);
  });

  it("returns 422 when starting before 09:00", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();
    await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send({
        movieId: movie.id,
        roomId: room.id,
        startsAt: "2030-02-04T08:30:00.000Z",
        endsAt: "2030-02-04T10:30:00.000Z",
        priceCents: 1000,
      })
      .expect(422);
  });

  it("returns 422 when ending after 20:00", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();
    await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send({
        movieId: movie.id,
        roomId: room.id,
        startsAt: "2030-02-04T19:00:00.000Z",
        endsAt: "2030-02-04T21:00:00.000Z",
        priceCents: 1000,
      })
      .expect(422);
  });

  it("returns 422 when start >= end", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();
    await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send({
        movieId: movie.id,
        roomId: room.id,
        startsAt: MON_12H.toISOString(),
        endsAt: MON_10H.toISOString(),
        priceCents: 1000,
      })
      .expect(422);
  });

  it("accepts a session that ends exactly at 20:00", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const movie = await prisma.movie.create({ data: baseMovie({ durationMin: 60 }) });
    const room = await prisma.room.create({ data: baseRoom() });
    await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send({
        movieId: movie.id,
        roomId: room.id,
        startsAt: "2030-02-04T18:30:00.000Z",
        endsAt: "2030-02-04T20:00:00.000Z", // 90 min exactly = 60 + 30
        priceCents: 1000,
      })
      .expect(200);
  });
});

describe("POST /v1/sessions — duration rule", () => {
  it("returns 422 when the session is shorter than movie + 30 min", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const movie = await prisma.movie.create({ data: baseMovie({ durationMin: 90 }) });
    const room = await prisma.room.create({ data: baseRoom() });
    await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send({
        movieId: movie.id,
        roomId: room.id,
        startsAt: MON_10H.toISOString(),
        endsAt: "2030-02-04T11:59:00.000Z", // 119 min, need 120
        priceCents: 1000,
      })
      .expect(422);
  });

  it("accepts a session exactly equal to movie + 30 min", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const movie = await prisma.movie.create({ data: baseMovie({ durationMin: 90 }) });
    const room = await prisma.room.create({ data: baseRoom() });
    await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send({
        movieId: movie.id,
        roomId: room.id,
        startsAt: MON_10H.toISOString(),
        endsAt: MON_12H.toISOString(), // 120 min = 90 + 30
        priceCents: 1000,
      })
      .expect(200);
  });
});

describe("POST /v1/sessions — overlap rule", () => {
  it("returns 409 when overlapping in the same room", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();
    await prisma.session.create({
      data: { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H30, priceCents: 1000 },
    });
    const otherMovie = await prisma.movie.create({ data: baseMovie({ title: "Other" }) });
    await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send({
        movieId: otherMovie.id,
        roomId: room.id,
        startsAt: MON_12H.toISOString(),
        endsAt: MON_14H.toISOString(),
        priceCents: 1000,
      })
      .expect(409);
  });

  it("returns 409 when overlapping for the same movie in another room", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();
    await prisma.session.create({
      data: { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H30, priceCents: 1000 },
    });
    const otherRoom = await prisma.room.create({ data: baseRoom() });
    await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send({
        movieId: movie.id,
        roomId: otherRoom.id,
        startsAt: "2030-02-04T11:00:00.000Z",
        endsAt: "2030-02-04T13:30:00.000Z",
        priceCents: 1000,
      })
      .expect(409);
  });

  it("accepts back-to-back sessions in the same room (boundary)", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();
    await prisma.session.create({
      data: { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H, priceCents: 1000 },
    });
    const otherMovie = await prisma.movie.create({ data: baseMovie({ title: "Other" }) });
    await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send({
        movieId: otherMovie.id,
        roomId: room.id,
        startsAt: MON_12H.toISOString(),
        endsAt: MON_14H.toISOString(),
        priceCents: 1000,
      })
      .expect(200);
  });

  it("accepts overlapping sessions in different rooms for different movies", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();
    await prisma.session.create({
      data: { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H30, priceCents: 1000 },
    });
    const otherMovie = await prisma.movie.create({ data: baseMovie({ title: "Other" }) });
    const otherRoom = await prisma.room.create({ data: baseRoom() });
    await request(app)
      .post("/v1/sessions")
      .set("Authorization", authHeader)
      .send({
        movieId: otherMovie.id,
        roomId: otherRoom.id,
        startsAt: "2030-02-04T11:00:00.000Z",
        endsAt: "2030-02-04T13:30:00.000Z",
        priceCents: 1000,
      })
      .expect(200);
  });
});

describe("GET /v1/sessions", () => {
  it("returns sessions sorted by startsAt for an authenticated user", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const { movie, room } = await seedMovieAndRoom();
    await prisma.session.createMany({
      data: [
        { movieId: movie.id, roomId: room.id, startsAt: MON_12H30, endsAt: MON_15H, priceCents: 1000 },
        { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H, priceCents: 1000 },
      ],
    });

    const res = await request(app).get("/v1/sessions").set("Authorization", authHeader).expect(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(new Date(res.body.data.items[0].startsAt).getTime()).toBeLessThan(
      new Date(res.body.data.items[1].startsAt).getTime(),
    );
    expect(res.body.data.items[0].movie.title).toBe("Test Movie");
    expect(res.body.data.items[0].room.id).toBe(room.id);
  });

  it("filters by from/to", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const { movie, room } = await seedMovieAndRoom();
    await prisma.session.createMany({
      data: [
        { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H, priceCents: 1000 },
        {
          movieId: movie.id,
          roomId: room.id,
          startsAt: new Date("2030-03-04T10:00:00.000Z"), // Mon
          endsAt: new Date("2030-03-04T12:00:00.000Z"),
          priceCents: 1000,
        },
      ],
    });

    const res = await request(app)
      .get("/v1/sessions")
      .set("Authorization", authHeader)
      .query({ from: "2030-02-15T00:00:00.000Z" })
      .expect(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(new Date(res.body.data.items[0].startsAt).getUTCMonth()).toBe(2); // March (0-indexed)
  });

  it("excludes sessions in maintenance rooms", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const movie = await prisma.movie.create({ data: baseMovie() });
    const goodRoom = await prisma.room.create({ data: baseRoom() });
    const brokenRoom = await prisma.room.create({ data: baseRoom({ underMaintenance: true }) });
    await prisma.session.createMany({
      data: [
        { movieId: movie.id, roomId: goodRoom.id, startsAt: MON_10H, endsAt: MON_12H, priceCents: 1000 },
        { movieId: movie.id, roomId: brokenRoom.id, startsAt: MON_12H30, endsAt: MON_15H, priceCents: 1000 },
      ],
    });

    const res = await request(app).get("/v1/sessions").set("Authorization", authHeader).expect(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].room.id).toBe(goodRoom.id);
  });

  it("returns 401 without token", async () => {
    await request(app).get("/v1/sessions").expect(401);
  });
});

describe("GET /v1/sessions/:id", () => {
  it("returns a session by id with movie and room details", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const { movie, room } = await seedMovieAndRoom();
    const session = await prisma.session.create({
      data: { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H, priceCents: 1000 },
    });

    const res = await request(app).get(`/v1/sessions/${session.id}`).set("Authorization", authHeader).expect(200);
    expect(res.body.data.id).toBe(session.id);
    expect(res.body.data.movie.title).toBe("Test Movie");
  });

  it("returns 404 for a missing id", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    await request(app).get("/v1/sessions/missing-id").set("Authorization", authHeader).expect(404);
  });
});

describe("PUT /v1/sessions/:id", () => {
  it("updates a session and re-validates the schedule", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();
    const session = await prisma.session.create({
      data: { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H, priceCents: 1000 },
    });

    const res = await request(app)
      .put(`/v1/sessions/${session.id}`)
      .set("Authorization", authHeader)
      .send({ priceCents: 1500 })
      .expect(200);
    expect(res.body.data.priceCents).toBe(1500);
  });

  it("excludes itself from the overlap check on update", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();
    const session = await prisma.session.create({
      data: { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H, priceCents: 1000 },
    });

    // Updating only the price should not trigger a self-overlap conflict
    await request(app)
      .put(`/v1/sessions/${session.id}`)
      .set("Authorization", authHeader)
      .send({ priceCents: 2000 })
      .expect(200);
  });

  it("returns 422 when the merged schedule violates duration", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();
    const session = await prisma.session.create({
      data: { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H, priceCents: 1000 },
    });
    await request(app)
      .put(`/v1/sessions/${session.id}`)
      .set("Authorization", authHeader)
      .send({ endsAt: "2030-02-04T11:00:00.000Z" })
      .expect(422);
  });

  it("returns 403 for a client", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const { movie, room } = await seedMovieAndRoom();
    const session = await prisma.session.create({
      data: { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H, priceCents: 1000 },
    });
    await request(app)
      .put(`/v1/sessions/${session.id}`)
      .set("Authorization", authHeader)
      .send({ priceCents: 1500 })
      .expect(403);
  });

  it("returns 404 for a missing session", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await request(app)
      .put("/v1/sessions/missing-id")
      .set("Authorization", authHeader)
      .send({ priceCents: 1500 })
      .expect(404);
  });
});

describe("DELETE /v1/sessions/:id", () => {
  it("deletes a session when called by an admin", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();
    const session = await prisma.session.create({
      data: { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H, priceCents: 1000 },
    });

    await request(app).delete(`/v1/sessions/${session.id}`).set("Authorization", authHeader).expect(200);
    expect(await prisma.session.findUnique({ where: { id: session.id } })).toBeNull();
  });

  it("returns 409 when the session has tickets used", async () => {
    const { authHeader, user: admin } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();
    const session = await prisma.session.create({
      data: { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H, priceCents: 1000 },
    });
    const ticket = await prisma.ticket.create({
      data: { userId: admin.id, kind: "STANDARD", usesRemaining: 0 },
    });
    await prisma.ticketUsage.create({ data: { ticketId: ticket.id, sessionId: session.id } });

    await request(app).delete(`/v1/sessions/${session.id}`).set("Authorization", authHeader).expect(409);
  });

  it("returns 403 for a client", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const { movie, room } = await seedMovieAndRoom();
    const session = await prisma.session.create({
      data: { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H, priceCents: 1000 },
    });
    await request(app).delete(`/v1/sessions/${session.id}`).set("Authorization", authHeader).expect(403);
  });

  it("returns 404 for a missing id", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await request(app).delete("/v1/sessions/missing-id").set("Authorization", authHeader).expect(404);
  });
});

describe("GET /v1/sessions/:id/attendance", () => {
  it("returns the count of TicketUsage rows for the session", async () => {
    const { authHeader, user: admin } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();
    const session = await prisma.session.create({
      data: { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H, priceCents: 1000 },
    });
    const ticket = await prisma.ticket.create({
      data: { userId: admin.id, kind: "STANDARD", usesRemaining: 0 },
    });
    await prisma.ticketUsage.create({ data: { ticketId: ticket.id, sessionId: session.id } });

    const res = await request(app)
      .get(`/v1/sessions/${session.id}/attendance`)
      .set("Authorization", authHeader)
      .expect(200);
    expect(res.body.data.sessionId).toBe(session.id);
    expect(res.body.data.attendeesCount).toBe(1);
  });

  it("returns 0 for a session with no tickets", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { movie, room } = await seedMovieAndRoom();
    const session = await prisma.session.create({
      data: { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H, priceCents: 1000 },
    });
    const res = await request(app)
      .get(`/v1/sessions/${session.id}/attendance`)
      .set("Authorization", authHeader)
      .expect(200);
    expect(res.body.data.attendeesCount).toBe(0);
  });

  it("returns 403 for a client", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const { movie, room } = await seedMovieAndRoom();
    const session = await prisma.session.create({
      data: { movieId: movie.id, roomId: room.id, startsAt: MON_10H, endsAt: MON_12H, priceCents: 1000 },
    });
    await request(app).get(`/v1/sessions/${session.id}/attendance`).set("Authorization", authHeader).expect(403);
  });

  it("returns 404 for a missing session", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await request(app).get("/v1/sessions/missing-id/attendance").set("Authorization", authHeader).expect(404);
  });
});
