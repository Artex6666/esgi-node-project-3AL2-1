import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../../src/config/prisma.js";
import { app } from "../../src/app.js";

describe("Tickets", () => {
  let token: string;
  let sessionId: string;
  const email = `tickets-${Date.now()}@test.com`;
  const password = "password123";

  beforeAll(async () => {
    await request(app).post("/v1/auth/register").send({ email, password });

    const loginResponse = await request(app).post("/v1/auth/login").send({
      email,
      password,
    });

    token = loginResponse.body.data.tokens.accessToken;

    const movie = await prisma.movie.create({
      data: {
        title: "Film test tickets",
        description: "Film pour les tests tickets",
        durationMin: 90,
        genre: "TEST",
        releasedAt: new Date(),
      },
    });

    const room = await prisma.room.create({
      data: {
        name: `Salle tickets ${Date.now()}`,
        description: "Salle pour les tests tickets",
        images: [],
        type: "STANDARD",
        capacity: 15,
      },
    });

    const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);

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
  });

  it("refuse l'achat d'un ticket si le solde est insuffisant", async () => {
    const response = await request(app)
      .post("/v1/tickets/buy")
      .set("Authorization", `Bearer ${token}`)
      .send({ kind: "STANDARD" });

    expect(response.status).toBe(400);
  });

  it("permet d'acheter un ticket STANDARD", async () => {
    await request(app)
      .post("/v1/wallet/deposit")
      .set("Authorization", `Bearer ${token}`)
      .send({ amountCents: 2000 });

    const response = await request(app)
      .post("/v1/tickets/buy")
      .set("Authorization", `Bearer ${token}`)
      .send({ kind: "STANDARD" });

    expect(response.status).toBe(200);
    expect(response.body.data.ticket.kind).toBe("STANDARD");
    expect(response.body.data.ticket.usesRemaining).toBe(1);
  });

  it("permet d'acheter un ticket SUPER", async () => {
    await request(app)
      .post("/v1/wallet/deposit")
      .set("Authorization", `Bearer ${token}`)
      .send({ amountCents: 10000 });

    const response = await request(app)
      .post("/v1/tickets/buy")
      .set("Authorization", `Bearer ${token}`)
      .send({ kind: "SUPER" });

    expect(response.status).toBe(200);
    expect(response.body.data.ticket.kind).toBe("SUPER");
    expect(response.body.data.ticket.usesRemaining).toBe(10);
  });

  it("retourne les tickets de l'utilisateur", async () => {
    const response = await request(app)
      .get("/v1/tickets")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.tickets.length).toBeGreaterThanOrEqual(2);
  });

  it("permet d'utiliser un ticket sur une séance", async () => {
    await request(app)
      .post("/v1/wallet/deposit")
      .set("Authorization", `Bearer ${token}`)
      .send({ amountCents: 1000 });

    const buyResponse = await request(app)
      .post("/v1/tickets/buy")
      .set("Authorization", `Bearer ${token}`)
      .send({ kind: "STANDARD" });

    const ticketId = buyResponse.body.data.ticket.id;

    const response = await request(app)
      .post("/v1/tickets/use")
      .set("Authorization", `Bearer ${token}`)
      .send({ ticketId, sessionId });

    expect(response.status).toBe(200);
    expect(response.body.data.usesRemaining).toBe(0);
  });

  it("retourne l'historique des tickets utilisés", async () => {
    const response = await request(app)
      .get("/v1/tickets/usages")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.usages.length).toBeGreaterThanOrEqual(1);
  });

  it("refuse d'utiliser deux tickets sur la même séance", async () => {
    await request(app)
      .post("/v1/wallet/deposit")
      .set("Authorization", `Bearer ${token}`)
      .send({ amountCents: 1000 });

    const buyResponse = await request(app)
      .post("/v1/tickets/buy")
      .set("Authorization", `Bearer ${token}`)
      .send({ kind: "STANDARD" });

    const response = await request(app)
      .post("/v1/tickets/use")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ticketId: buyResponse.body.data.ticket.id,
        sessionId,
      });

    expect(response.status).toBe(400);
  });
});