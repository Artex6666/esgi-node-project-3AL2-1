import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

import { app } from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";

describe("Stats", () => {
  let adminToken: string;
  let clientToken: string;
  let sessionId: string;

  const adminEmail = `admin-stats-${Date.now()}@test.com`;
  const clientEmail = `client-stats-${Date.now()}@test.com`;
  const password = "password123";

  beforeAll(async () => {
    await request(app).post("/v1/auth/register").send({
      email: adminEmail,
      password,
    });

    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN" },
    });

    const adminLogin = await request(app).post("/v1/auth/login").send({
      email: adminEmail,
      password,
    });

    adminToken = adminLogin.body.data.tokens.accessToken;

    await request(app).post("/v1/auth/register").send({
      email: clientEmail,
      password,
    });

    const clientLogin = await request(app).post("/v1/auth/login").send({
      email: clientEmail,
      password,
    });

    clientToken = clientLogin.body.data.tokens.accessToken;

    const client = await prisma.user.findUniqueOrThrow({
      where: { email: clientEmail },
    });

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
        name: `Salle stats ${Date.now()}`,
        description: "Salle pour les tests stats",
        images: [],
        type: "STANDARD",
        capacity: 20,
      },
    });

    const startsAt = new Date("2026-06-01T10:00:00.000Z");
    const endsAt = new Date("2026-06-01T12:00:00.000Z");

    const session = await prisma.session.create({
      data: {
        movieId: movie.id,
        roomId: room.id,
        startsAt,
        endsAt,
        priceCents: 1000,
      },
    });

    sessionId = session.id;

    const ticket1 = await prisma.ticket.create({
      data: {
        userId: client.id,
        kind: "STANDARD",
        usesRemaining: 0,
      },
    });

    const ticket2 = await prisma.ticket.create({
      data: {
        userId: client.id,
        kind: "SUPER",
        usesRemaining: 9,
      },
    });

    await prisma.ticketUsage.createMany({
      data: [
        {
          ticketId: ticket1.id,
          sessionId,
        },
        {
          ticketId: ticket2.id,
          sessionId,
        },
      ],
    });
  });

  it("refuse les statistiques à un client", async () => {
    const response = await request(app)
      .get("/v1/stats/attendance")
      .set("Authorization", `Bearer ${clientToken}`);

    expect(response.status).toBe(403);
  });

  it("retourne les statistiques globales de fréquentation", async () => {
    const response = await request(app)
      .get("/v1/stats/attendance")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        from: "2026-06-01T00:00:00.000Z",
        to: "2026-06-02T00:00:00.000Z",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.attendeesCount).toBe(2);
    expect(response.body.data.sessionsCount).toBe(1);
    expect(response.body.data.totalCapacity).toBe(20);
    expect(response.body.data.occupancyRate).toBe(0.1);
  });

  it("retourne les statistiques par jour", async () => {
    const response = await request(app)
      .get("/v1/stats/daily")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        from: "2026-06-01T00:00:00.000Z",
        to: "2026-06-02T00:00:00.000Z",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.days).toHaveLength(1);
    expect(response.body.data.days[0].date).toBe("2026-06-01");
    expect(response.body.data.days[0].attendeesCount).toBe(2);
    expect(response.body.data.days[0].sessionsCount).toBe(1);
    expect(response.body.data.days[0].totalCapacity).toBe(20);
    expect(response.body.data.days[0].occupancyRate).toBe(0.1);
  });

  it("retourne les statistiques par semaine", async () => {
    const response = await request(app)
      .get("/v1/stats/weekly")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        from: "2026-06-01T00:00:00.000Z",
        to: "2026-06-08T00:00:00.000Z",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.weeks).toHaveLength(1);
    expect(response.body.data.weeks[0].weekStart).toBe("2026-06-01");
    expect(response.body.data.weeks[0].attendeesCount).toBe(2);
    expect(response.body.data.weeks[0].sessionsCount).toBe(1);
    expect(response.body.data.weeks[0].totalCapacity).toBe(20);
    expect(response.body.data.weeks[0].occupancyRate).toBe(0.1);
  });

  it("retourne les statistiques d'une séance", async () => {
    const response = await request(app)
      .get(`/v1/stats/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.sessionId).toBe(sessionId);
    expect(response.body.data.attendeesCount).toBe(2);
    expect(response.body.data.capacity).toBe(20);
    expect(response.body.data.occupancyRate).toBe(0.1);
  });

  it("refuse une période invalide", async () => {
    const response = await request(app)
      .get("/v1/stats/attendance")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        from: "2026-06-02T00:00:00.000Z",
        to: "2026-06-01T00:00:00.000Z",
      });

    expect(response.status).toBe(400);
  });

  it("retourne 404 si la séance n'existe pas", async () => {
    const response = await request(app)
      .get("/v1/stats/sessions/session-inexistante")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});