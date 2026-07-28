import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { buildTestApp } from "./helpers.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

describe("GET /api/sales-points", () => {
  it("retourne un tableau vide si aucun point de vente publié", async () => {
    const res = await app.inject({ method: "GET", url: "/api/sales-points" });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ salesPoints: unknown[] }>().salesPoints).toEqual([]);
  });

  it("ne renvoie que les points de vente publiés", async () => {
    await prisma.salesPoint.create({
      data: {
        name: "Point visible",
        address: "1 rue de test",
        description: "Visible",
        published: true,
      },
    });

    await prisma.salesPoint.create({
      data: {
        name: "Point caché",
        address: "2 rue de test",
        description: "Caché",
        published: false,
      },
    });

    const res = await app.inject({ method: "GET", url: "/api/sales-points" });
    const { salesPoints } = res.json<{
      salesPoints: Array<{ name: string; published?: boolean }>;
    }>();

    expect(res.statusCode).toBe(200);
    expect(salesPoints).toHaveLength(1);
    expect(salesPoints[0].name).toBe("Point visible");
  });

  it("retourne un tableau vide si la table n'existe pas encore", async () => {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "SalesPoint"`);

    const res = await app.inject({ method: "GET", url: "/api/sales-points" });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ salesPoints: unknown[] }>().salesPoints).toEqual([]);
  });
});
