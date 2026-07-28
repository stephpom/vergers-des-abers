import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { authedInject, buildTestApp, createTestUser, loginCookie } from "./helpers.js";

let app: FastifyInstance;
let cookie: string;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await createTestUser("admin@test.local", "admin-password-ok");
  cookie = await loginCookie(app, "admin@test.local", "admin-password-ok");
});

describe("GET /api/admin/sales-points", () => {
  it("retourne 401 sans cookie", async () => {
    const res = await app.inject({ method: "GET", url: "/api/admin/sales-points" });
    expect(res.statusCode).toBe(401);
  });

  it("retourne tous les points de vente (publiés + non publiés)", async () => {
    await prisma.salesPoint.create({
      data: { name: "Visible", address: "1 rue de la plage", published: true },
    });
    await prisma.salesPoint.create({
      data: { name: "Masqué", address: "2 rue du port", published: false },
    });

    const res = await authedInject(app, { method: "GET", url: "/api/admin/sales-points" }, cookie);
    expect(res.statusCode).toBe(200);
    const { salesPoints } = res.json<{
      salesPoints: Array<{ name: string; published: boolean }>;
    }>();
    expect(salesPoints).toHaveLength(2);
    expect(salesPoints.some((point) => point.name === "Visible" && point.published)).toBe(true);
    expect(salesPoints.some((point) => point.name === "Masqué" && !point.published)).toBe(true);
  });
});

describe("POST /api/admin/sales-points", () => {
  it("crée un point de vente", async () => {
    const res = await authedInject(
      app,
      {
        method: "POST",
        url: "/api/admin/sales-points",
        payload: {
          name: "Point du centre",
          address: "Place du centre",
          description: "Sur la place",
          latitude: 48.4545,
          longitude: -2.0418,
          published: true,
        },
      },
      cookie,
    );

    expect(res.statusCode).toBe(201);
    const { salesPoint } = res.json<{
      salesPoint: { id: string; name: string; published: boolean };
    }>();
    expect(salesPoint.name).toBe("Point du centre");
    expect(salesPoint.published).toBe(true);
  });
});

describe("PATCH /api/admin/sales-points/:id", () => {
  it("met à jour un point de vente", async () => {
    const created = await prisma.salesPoint.create({
      data: {
        name: "Ancien nom",
        address: "Ancienne adresse",
        latitude: 48.4545,
        longitude: -2.0418,
        published: false,
      },
    });

    const res = await authedInject(
      app,
      {
        method: "PATCH",
        url: `/api/admin/sales-points/${created.id}`,
        payload: {
          name: "Nouveau nom",
          latitude: 48.4545,
          longitude: -2.0418,
          published: true,
        },
      },
      cookie,
    );

    expect(res.statusCode).toBe(200);
    const { salesPoint } = res.json<{
      salesPoint: { id: string; name: string; published: boolean };
    }>();
    expect(salesPoint.id).toBe(created.id);
    expect(salesPoint.name).toBe("Nouveau nom");
    expect(salesPoint.published).toBe(true);
  });
});

describe("DELETE /api/admin/sales-points/:id", () => {
  it("supprime un point de vente et retourne 204", async () => {
    const created = await prisma.salesPoint.create({
      data: { name: "À supprimer", address: "Adresse", published: true },
    });

    const res = await authedInject(
      app,
      { method: "DELETE", url: `/api/admin/sales-points/${created.id}` },
      cookie,
    );

    expect(res.statusCode).toBe(204);

    const check = await authedInject(
      app,
      { method: "GET", url: "/api/admin/sales-points" },
      cookie,
    );
    const { salesPoints } = check.json<{ salesPoints: Array<{ id: string }> }>();
    expect(salesPoints.some((point) => point.id === created.id)).toBe(false);
  });
});
