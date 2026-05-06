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

const seedSessionWithUsages = async (
  startsAt: Date,
  capacity: number,
  attendeesCount: number,
) => {
  const movie = await prisma.movie.create({
    data: {
      title: "Film stats test",
      description: "Film pour tester les statistiques",
      durationMin: 90,
      genre: "TEST",
      releasedAt: new Date(),
    },
  });
  const room = await prisma.room.create({
    data: {
      name: `Salle stats ${crypto.randomUUID().slice(0, 8)}`,
      description: "Salle pour les tests stats",
      images: [],
      type: "STANDARD",
      capacity,
    },
  });
  const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
  const session = await prisma.session.create({
    data: { movieId: movie.id, roomId: room.id, startsAt, endsAt, priceCents: 1000 },
  });
  for (let i = 0; i < attendeesCount; i++) {
    const { user } = await seedUser({ email: `stats-user-${i}-${crypto.randomUUID()}@test.com` });
    const ticket = await prisma.ticket.create({
      data: { userId: user.id, kind: "STANDARD", usesRemaining: 0 },
    });
    await prisma.ticketUsage.create({ data: { ticketId: ticket.id, sessionId: session.id } });
  }
  return { session };
};

describe("Stats", () => {
  it("refuse les statistiques à un client", async () => {
    const { authHeader } = await seedUser({ role: "CLIENT" });
    const response = await request(app).get("/v1/stats/attendance").set("Authorization", authHeader);

    expect(response.status).toBe(403);
  });

  it("retourne les statistiques globales de fréquentation", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await seedSessionWithUsages(new Date("2026-06-01T10:00:00.000Z"), 20, 2);

    const response = await request(app)
      .get("/v1/stats/attendance")
      .set("Authorization", authHeader)
      .query({ from: "2026-06-01T00:00:00.000Z", to: "2026-06-02T00:00:00.000Z" });

    expect(response.status).toBe(200);
    expect(response.body.data.attendeesCount).toBe(2);
    expect(response.body.data.sessionsCount).toBe(1);
    expect(response.body.data.totalCapacity).toBe(20);
    expect(response.body.data.occupancyRate).toBe(0.1);
  });

  it("retourne les statistiques par jour", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await seedSessionWithUsages(new Date("2026-06-01T10:00:00.000Z"), 20, 2);

    const response = await request(app)
      .get("/v1/stats/daily")
      .set("Authorization", authHeader)
      .query({ from: "2026-06-01T00:00:00.000Z", to: "2026-06-02T00:00:00.000Z" });

    expect(response.status).toBe(200);
    expect(response.body.data.days).toHaveLength(1);
    expect(response.body.data.days[0].date).toBe("2026-06-01");
    expect(response.body.data.days[0].attendeesCount).toBe(2);
    expect(response.body.data.days[0].sessionsCount).toBe(1);
    expect(response.body.data.days[0].totalCapacity).toBe(20);
    expect(response.body.data.days[0].occupancyRate).toBe(0.1);
  });

  it("retourne les statistiques par semaine", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    await seedSessionWithUsages(new Date("2026-06-01T10:00:00.000Z"), 20, 2);

    const response = await request(app)
      .get("/v1/stats/weekly")
      .set("Authorization", authHeader)
      .query({ from: "2026-06-01T00:00:00.000Z", to: "2026-06-08T00:00:00.000Z" });

    expect(response.status).toBe(200);
    expect(response.body.data.weeks).toHaveLength(1);
    expect(response.body.data.weeks[0].weekStart).toBe("2026-06-01");
    expect(response.body.data.weeks[0].attendeesCount).toBe(2);
    expect(response.body.data.weeks[0].sessionsCount).toBe(1);
    expect(response.body.data.weeks[0].totalCapacity).toBe(20);
    expect(response.body.data.weeks[0].occupancyRate).toBe(0.1);
  });

  it("retourne les statistiques d'une séance", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const { session } = await seedSessionWithUsages(new Date("2026-06-01T10:00:00.000Z"), 20, 2);

    const response = await request(app)
      .get(`/v1/stats/sessions/${session.id}`)
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.data.sessionId).toBe(session.id);
    expect(response.body.data.attendeesCount).toBe(2);
    expect(response.body.data.capacity).toBe(20);
    expect(response.body.data.occupancyRate).toBe(0.1);
  });

  it("refuse une période invalide", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const response = await request(app)
      .get("/v1/stats/attendance")
      .set("Authorization", authHeader)
      .query({ from: "2026-06-02T00:00:00.000Z", to: "2026-06-01T00:00:00.000Z" });

    expect(response.status).toBe(400);
  });

  it("retourne 404 si la séance n'existe pas", async () => {
    const { authHeader } = await seedUser({ role: "ADMIN" });
    const response = await request(app)
      .get("/v1/stats/sessions/session-inexistante")
      .set("Authorization", authHeader);

    expect(response.status).toBe(404);
  });
});
