import { afterAll, beforeAll, describe, it, expect } from "vitest";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { buildTestApp, createTestProduct } from "./helpers.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

describe("GET /api/products", () => {
  it("retourne un tableau vide si aucun produit publié", async () => {
    const res = await app.inject({ method: "GET", url: "/api/products" });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ products: unknown[] }>().products).toEqual([]);
  });

  it("ne renvoie que les produits published:true", async () => {
    await createTestProduct({ title: "Produit publié", published: true });
    await createTestProduct({ title: "Brouillon", published: false });

    const res = await app.inject({ method: "GET", url: "/api/products" });
    expect(res.statusCode).toBe(200);
    const { products } = res.json<{ products: Array<{ title: string; published: boolean }> }>();
    expect(products).toHaveLength(1);
    expect(products[0].title).toBe("Produit publié");
    expect(products[0].published).toBe(true);
  });

  it("retourne les images triées par position croissant", async () => {
    const product = await createTestProduct({ title: "Avec images", published: true });
    // Insérer des images dans le désordre
    await prisma.productImage.create({
      data: { productId: product.id, filename: "b.jpg", alt: "b", position: 2 },
    });
    await prisma.productImage.create({
      data: { productId: product.id, filename: "a.jpg", alt: "a", position: 0 },
    });
    await prisma.productImage.create({
      data: { productId: product.id, filename: "c.jpg", alt: "c", position: 1 },
    });

    const res = await app.inject({ method: "GET", url: "/api/products" });
    const { products } = res.json<{
      products: Array<{ images: Array<{ position: number }> }>;
    }>();
    const images = products[0].images;
    expect(images.map((i) => i.position)).toEqual([0, 1, 2]);
  });
});

describe("GET /api/products/:slug", () => {
  it("retourne 404 pour un slug inexistant", async () => {
    const res = await app.inject({ method: "GET", url: "/api/products/slug-inexistant" });
    expect(res.statusCode).toBe(404);
  });

  it("retourne 404 pour un produit non publié", async () => {
    const product = await createTestProduct({ title: "Draft", published: false });
    const res = await app.inject({ method: "GET", url: `/api/products/${product.slug}` });
    expect(res.statusCode).toBe(404);
  });

  it("retourne le produit publié avec ses images", async () => {
    const product = await createTestProduct({ title: "Publié", published: true });
    const res = await app.inject({ method: "GET", url: `/api/products/${product.slug}` });
    expect(res.statusCode).toBe(200);
    const { product: p } = res.json<{
      product: { id: string; slug: string; images: unknown[] };
    }>();
    expect(p.id).toBe(product.id);
    expect(p.slug).toBe(product.slug);
    expect(Array.isArray(p.images)).toBe(true);
  });
});
