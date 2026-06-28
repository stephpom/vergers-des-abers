import { afterAll, beforeAll, beforeEach, describe, it, expect } from "vitest";
import type { FastifyInstance } from "fastify";
import {
  buildTestApp,
  createTestProduct,
  createTestUser,
  loginCookie,
  authedInject,
} from "./helpers.js";

let app: FastifyInstance;
let cookie: string;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

// Le setup global (setup.ts) truncate les tables avant chaque test.
// On recrée donc l'admin avant chaque test qui en a besoin.
beforeEach(async () => {
  await createTestUser("admin@test.local", "admin-password-ok");
  cookie = await loginCookie(app, "admin@test.local", "admin-password-ok");
});

describe("GET /api/admin/products", () => {
  it("retourne 401 sans cookie", async () => {
    const res = await app.inject({ method: "GET", url: "/api/admin/products" });
    expect(res.statusCode).toBe(401);
  });

  it("retourne tous les produits (publiés + brouillons)", async () => {
    await createTestProduct({ title: "Publié", published: true });
    await createTestProduct({ title: "Draft", published: false });

    const res = await authedInject(app, { method: "GET", url: "/api/admin/products" }, cookie);
    expect(res.statusCode).toBe(200);
    const { products } = res.json<{ products: unknown[] }>();
    expect(products).toHaveLength(2);
  });
});

describe("POST /api/admin/products", () => {
  it("retourne 401 sans cookie", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/admin/products",
      payload: { title: "Test" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("retourne 400 si title absent", async () => {
    const res = await authedInject(
      app,
      {
        method: "POST",
        url: "/api/admin/products",
        payload: { description: "sans titre" },
      },
      cookie,
    );
    expect(res.statusCode).toBe(400);
  });

  it("crée un produit avec slug auto et published:false par défaut (201)", async () => {
    const res = await authedInject(
      app,
      {
        method: "POST",
        url: "/api/admin/products",
        payload: { title: "Mon Nouveau Produit" },
      },
      cookie,
    );
    expect(res.statusCode).toBe(201);
    const { product } = res.json<{
      product: { id: string; slug: string; published: boolean };
    }>();
    expect(product.slug).toBe("mon-nouveau-produit");
    expect(product.published).toBe(false);
  });

  it("génère un slug suffixé si le slug existe déjà", async () => {
    await createTestProduct({ title: "Mon Produit" });

    const res = await authedInject(
      app,
      {
        method: "POST",
        url: "/api/admin/products",
        payload: { title: "Mon Produit" },
      },
      cookie,
    );
    expect(res.statusCode).toBe(201);
    const { product } = res.json<{ product: { slug: string } }>();
    expect(product.slug).toBe("mon-produit-2");
  });

  it("sanitize les balises <script> dans la description", async () => {
    const res = await authedInject(
      app,
      {
        method: "POST",
        url: "/api/admin/products",
        payload: {
          title: "XSS test",
          description: "<p>Texte</p><script>alert(1)</script>",
        },
      },
      cookie,
    );
    expect(res.statusCode).toBe(201);
    const { product } = res.json<{ product: { description: string } }>();
    expect(product.description).not.toContain("<script>");
    expect(product.description).toContain("Texte");
  });
});

describe("PATCH /api/admin/products/:id", () => {
  it("retourne 404 pour un id inexistant", async () => {
    const res = await authedInject(
      app,
      {
        method: "PATCH",
        url: "/api/admin/products/id-qui-nexiste-pas",
        payload: { title: "Nouveau titre" },
      },
      cookie,
    );
    expect(res.statusCode).toBe(404);
  });

  it("publier un produit le rend visible dans GET /api/products", async () => {
    const product = await createTestProduct({ title: "À publier", published: false });

    await authedInject(
      app,
      {
        method: "PATCH",
        url: `/api/admin/products/${product.id}`,
        payload: { published: true },
      },
      cookie,
    );

    const res = await app.inject({ method: "GET", url: "/api/products" });
    const { products } = res.json<{ products: Array<{ id: string }> }>();
    expect(products.some((p) => p.id === product.id)).toBe(true);
  });
});

describe("DELETE /api/admin/products/:id", () => {
  it("retourne 404 pour un id inexistant", async () => {
    const res = await authedInject(
      app,
      { method: "DELETE", url: "/api/admin/products/id-fantome" },
      cookie,
    );
    expect(res.statusCode).toBe(404);
  });

  it("supprime le produit et retourne 204", async () => {
    const product = await createTestProduct({ title: "À supprimer" });

    const res = await authedInject(
      app,
      { method: "DELETE", url: `/api/admin/products/${product.id}` },
      cookie,
    );
    expect(res.statusCode).toBe(204);

    const check = await authedInject(app, { method: "GET", url: "/api/admin/products" }, cookie);
    const { products } = check.json<{ products: Array<{ id: string }> }>();
    expect(products.some((p) => p.id === product.id)).toBe(false);
  });
});
