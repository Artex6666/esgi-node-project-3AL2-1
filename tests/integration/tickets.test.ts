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

const seedFutureSession = async (capacity = 15) => {
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
      name: `Salle tickets ${crypto.randomUUID().slice(0, 8)}`,
      description: "Salle pour les tests tickets",
      images: [],
      type: "STANDARD",
      capacity,
    },
  });
  const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
  const session = await prisma.session.create({
    data: { movieId: movie.id, roomId: room.id, startsAt, endsAt, priceCents: 1000 },
  });
  return { movie, room, session };
};

describe("Tickets", () => {
  it("refuse l'achat d'un ticket si le solde est insuffisant", async () => {
    const { authHeader } = await seedUser();
    const response = await request(app)
      .post("/v1/tickets/buy")
      .set("Authorization", authHeader)
      .send({ kind: "STANDARD" });

    expect(response.status).toBe(422);
  });

  it("permet d'acheter un ticket STANDARD", async () => {
    const { authHeader } = await seedUser({ balanceCents: 2000 });
    const response = await request(app)
      .post("/v1/tickets/buy")
      .set("Authorization", authHeader)
      .send({ kind: "STANDARD" });

    expect(response.status).toBe(200);
    expect(response.body.data.ticket.kind).toBe("STANDARD");
    expect(response.body.data.ticket.usesRemaining).toBe(1);
  });

  it("permet d'acheter un ticket SUPER", async () => {
    const { authHeader } = await seedUser({ balanceCents: 10000 });
    const response = await request(app)
      .post("/v1/tickets/buy")
      .set("Authorization", authHeader)
      .send({ kind: "SUPER" });

    expect(response.status).toBe(200);
    expect(response.body.data.ticket.kind).toBe("SUPER");
    expect(response.body.data.ticket.usesRemaining).toBe(10);
  });

  it("retourne les tickets de l'utilisateur", async () => {
    const { authHeader } = await seedUser({ balanceCents: 3000 });
    await request(app)
      .post("/v1/tickets/buy")
      .set("Authorization", authHeader)
      .send({ kind: "STANDARD" });
    await request(app)
      .post("/v1/tickets/buy")
      .set("Authorization", authHeader)
      .send({ kind: "STANDARD" });

    const response = await request(app).get("/v1/tickets").set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.data.tickets).toHaveLength(2);
  });

  it("permet d'utiliser un ticket sur une séance", async () => {
    const { authHeader } = await seedUser({ balanceCents: 1000 });
    const { session } = await seedFutureSession();
    const buy = await request(app)
      .post("/v1/tickets/buy")
      .set("Authorization", authHeader)
      .send({ kind: "STANDARD" });
    const ticketId = buy.body.data.ticket.id;

    const response = await request(app)
      .post("/v1/tickets/use")
      .set("Authorization", authHeader)
      .send({ ticketId, sessionId: session.id });

    expect(response.status).toBe(200);
    expect(response.body.data.usesRemaining).toBe(0);
  });

  it("retourne l'historique des tickets utilisés", async () => {
    const { authHeader } = await seedUser({ balanceCents: 1000 });
    const { session } = await seedFutureSession();
    const buy = await request(app)
      .post("/v1/tickets/buy")
      .set("Authorization", authHeader)
      .send({ kind: "STANDARD" });
    await request(app)
      .post("/v1/tickets/use")
      .set("Authorization", authHeader)
      .send({ ticketId: buy.body.data.ticket.id, sessionId: session.id });

    const response = await request(app).get("/v1/tickets/usages").set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.data.usages).toHaveLength(1);
  });

  it("ne dépasse pas le solde lors d'achats concurrents", async () => {
    const STANDARD_PRICE = 1000;
    const { authHeader, user } = await seedUser({ balanceCents: 5 * STANDARD_PRICE });

    const responses = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app).post("/v1/tickets/buy").set("Authorization", authHeader).send({ kind: "STANDARD" }),
      ),
    );

    const successes = responses.filter((r) => r.status === 200);
    const failures = responses.filter((r) => r.status === 422);
    expect(successes).toHaveLength(5);
    expect(failures).toHaveLength(5);

    const finalUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(finalUser.balanceCents).toBe(0);
    const ticketCount = await prisma.ticket.count({ where: { userId: user.id } });
    expect(ticketCount).toBe(5);
  });

  it("refuse d'utiliser deux tickets sur la même séance", async () => {
    const { authHeader } = await seedUser({ balanceCents: 2000 });
    const { session } = await seedFutureSession();
    const buy1 = await request(app)
      .post("/v1/tickets/buy")
      .set("Authorization", authHeader)
      .send({ kind: "STANDARD" });
    await request(app)
      .post("/v1/tickets/use")
      .set("Authorization", authHeader)
      .send({ ticketId: buy1.body.data.ticket.id, sessionId: session.id });

    const buy2 = await request(app)
      .post("/v1/tickets/buy")
      .set("Authorization", authHeader)
      .send({ kind: "STANDARD" });
    const response = await request(app)
      .post("/v1/tickets/use")
      .set("Authorization", authHeader)
      .send({ ticketId: buy2.body.data.ticket.id, sessionId: session.id });

    expect(response.status).toBe(409);
  });
});
