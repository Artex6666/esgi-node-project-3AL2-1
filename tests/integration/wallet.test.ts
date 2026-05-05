import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";

import { app } from "../../src/app.js";

describe("Wallet", () => {
    let token: string;
    const email = `wallet-${Date.now()}@test.com`;
    const password = "password123";

    beforeAll(async () => {
        await request(app).post("/v1/auth/register").send({
            email,
            password,
        });

        const loginResponse = await request(app).post("/v1/auth/login").send({
            email,
            password,
        });

        token = loginResponse.body.data.tokens.accessToken;
    });

    it("retourne le wallet de l'utilisateur connecté", async () => {
        const response = await request(app)
            .get("/v1/wallet")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.balanceCents).toBe(0);
    });

    it("permet d'ajouter de l'argent au wallet", async () => {
        const response = await request(app)
            .post("/v1/wallet/deposit")
            .set("Authorization", `Bearer ${token}`)
            .send({ amountCents: 1000 });

        expect(response.status).toBe(200);
        expect(response.body.data.balanceCents).toBe(1000);
    });

    it("permet de retirer de l'argent du wallet", async () => {
        const response = await request(app)
            .post("/v1/wallet/withdraw")
            .set("Authorization", `Bearer ${token}`)
            .send({ amountCents: 500 });

        expect(response.status).toBe(200);
        expect(response.body.data.balanceCents).toBe(500);
    });

    it("refuse un retrait si le solde est insuffisant", async () => {
        const response = await request(app)
            .post("/v1/wallet/withdraw")
            .set("Authorization", `Bearer ${token}`)
            .send({ amountCents: 9999 });

        expect(response.status).toBe(400);
    });

    it("refuse un montant invalide", async () => {
        const response = await request(app)
            .post("/v1/wallet/deposit")
            .set("Authorization", `Bearer ${token}`)
            .send({ amountCents: -100 });

        expect(response.status).toBe(400);
    });

    it("retourne l'historique des transactions", async () => {
        const response = await request(app)
            .get("/v1/wallet/transactions")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.transactions.length).toBeGreaterThanOrEqual(2);
    });

    it("refuse l'accès sans token", async () => {
        const response = await request(app).get("/v1/wallet");

        expect(response.status).toBe(401);
    });
});