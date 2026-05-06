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

describe("Wallet", () => {
  it("retourne le wallet de l'utilisateur connecté", async () => {
    const { authHeader } = await seedUser();
    const response = await request(app).get("/v1/wallet").set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.data.balanceCents).toBe(0);
  });

  it("permet d'ajouter de l'argent au wallet", async () => {
    const { authHeader } = await seedUser();
    const response = await request(app)
      .post("/v1/wallet/deposit")
      .set("Authorization", authHeader)
      .send({ amountCents: 1000 });

    expect(response.status).toBe(200);
    expect(response.body.data.balanceCents).toBe(1000);
  });

  it("permet de retirer de l'argent du wallet", async () => {
    const { authHeader } = await seedUser({ balanceCents: 1000 });
    const response = await request(app)
      .post("/v1/wallet/withdraw")
      .set("Authorization", authHeader)
      .send({ amountCents: 500 });

    expect(response.status).toBe(200);
    expect(response.body.data.balanceCents).toBe(500);
  });

  it("refuse un retrait si le solde est insuffisant", async () => {
    const { authHeader } = await seedUser({ balanceCents: 100 });
    const response = await request(app)
      .post("/v1/wallet/withdraw")
      .set("Authorization", authHeader)
      .send({ amountCents: 9999 });

    expect(response.status).toBe(400);
  });

  it("refuse un montant invalide", async () => {
    const { authHeader } = await seedUser();
    const response = await request(app)
      .post("/v1/wallet/deposit")
      .set("Authorization", authHeader)
      .send({ amountCents: -100 });

    expect(response.status).toBe(400);
  });

  it("retourne l'historique des transactions", async () => {
    const { authHeader } = await seedUser();
    await request(app).post("/v1/wallet/deposit").set("Authorization", authHeader).send({ amountCents: 1000 });
    await request(app).post("/v1/wallet/withdraw").set("Authorization", authHeader).send({ amountCents: 200 });

    const response = await request(app).get("/v1/wallet/transactions").set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.data.transactions).toHaveLength(2);
  });

  it("refuse l'accès sans token", async () => {
    const response = await request(app).get("/v1/wallet");

    expect(response.status).toBe(401);
  });
});
