import { http, HttpResponse } from "msw";
import type { ApiProduct, ApiUser } from "@/types/api";

export const mockUser: ApiUser = { id: "user-1", email: "admin@test.com" };

export const mockProducts: ApiProduct[] = [
  {
    id: "prod-1",
    title: "Pomme Golden",
    slug: "pomme-golden",
    description: "<p>Description pomme</p>",
    published: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    images: [],
  },
  {
    id: "prod-2",
    title: "Pomme Granny",
    slug: "pomme-granny",
    description: "<p>Description granny</p>",
    published: false,
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
    images: [],
  },
];

export const defaultHandlers = [
  http.get("/api/auth/me", () => {
    return HttpResponse.json({ user: null }, { status: 401 });
  }),

  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === "admin@test.com" && body.password === "password") {
      return HttpResponse.json({ user: mockUser });
    }
    return HttpResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }),

  http.post("/api/auth/logout", () => {
    return HttpResponse.json({});
  }),

  http.get("/api/admin/products", () => {
    return HttpResponse.json({ products: mockProducts });
  }),

  http.get("/api/admin/products/:id", ({ params }) => {
    const product = mockProducts.find((p) => p.id === params.id);
    if (!product) return HttpResponse.json({ error: "Not found" }, { status: 404 });
    return HttpResponse.json({ product });
  }),

  http.post("/api/admin/products", async ({ request }) => {
    const body = (await request.json()) as Partial<ApiProduct>;
    const newProduct: ApiProduct = {
      id: "prod-new",
      title: body.title ?? "",
      slug: body.slug ?? "auto-slug",
      description: body.description ?? "",
      published: body.published ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: [],
    };
    return HttpResponse.json({ product: newProduct }, { status: 201 });
  }),

  http.patch("/api/admin/products/:id", async ({ params, request }) => {
    const body = (await request.json()) as Partial<ApiProduct>;
    const product = mockProducts.find((p) => p.id === params.id);
    if (!product) return HttpResponse.json({ error: "Not found" }, { status: 404 });
    const updated = { ...product, ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ product: updated });
  }),

  http.delete("/api/admin/products/:id", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete("/api/admin/products/:id/images/:imageId", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/admin/products/:id/images", () => {
    return HttpResponse.json(
      {
        image: { id: "img-1", filename: "test.jpg", alt: "Test", position: 0 },
      },
      { status: 201 },
    );
  }),

  // Routes publiques
  http.get("/api/products", () => {
    return HttpResponse.json({ products: mockProducts });
  }),

  http.get("/api/products/:slug", ({ params }) => {
    const product = mockProducts.find((p) => p.slug === params.slug);
    if (!product) return HttpResponse.json({ error: "Not found" }, { status: 404 });
    return HttpResponse.json({ product });
  }),
];
