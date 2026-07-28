import { http, HttpResponse } from "msw";
import type { ApiProduct, ApiSalesPoint, ApiUser } from "@/types/api";

export const mockUser: ApiUser = { id: "user-1", email: "admin@test.com" };

export const mockProducts: ApiProduct[] = [
  {
    id: "prod-1",
    title: "Pomme Golden",
    slug: "pomme-golden",
    description: "<p>Description pomme</p>",
    category: "JUICE",
    formats: ["L_1"],
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
    category: "JAM_JELLY",
    formats: [],
    published: false,
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
    images: [],
  },
];

export const mockSalesPoints: ApiSalesPoint[] = [
  {
    id: "sale-1",
    name: "Marché de Dinan",
    address: "1 rue du Port",
    description: "À côté de la mairie",
    latitude: 48.4545,
    longitude: -2.0418,
    published: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
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
      category: body.category ?? "JUICE",
      formats: body.formats ?? [],
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

  http.get("/api/admin/sales-points", () => {
    return HttpResponse.json({ salesPoints: mockSalesPoints });
  }),

  http.post("/api/admin/sales-points", async ({ request }) => {
    const body = (await request.json()) as Partial<ApiSalesPoint>;
    const newSalesPoint: ApiSalesPoint = {
      id: "sale-new",
      name: body.name ?? "",
      address: body.address ?? "",
      description: body.description ?? "",
      latitude: body.latitude ?? undefined,
      longitude: body.longitude ?? undefined,
      published: body.published ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ salesPoint: newSalesPoint }, { status: 201 });
  }),

  http.patch("/api/admin/sales-points/:id", async ({ params, request }) => {
    const body = (await request.json()) as Partial<ApiSalesPoint>;
    const salesPoint = mockSalesPoints.find((point) => point.id === params.id);
    if (!salesPoint) return HttpResponse.json({ error: "Not found" }, { status: 404 });
    const updated = { ...salesPoint, ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ salesPoint: updated });
  }),

  http.delete("/api/admin/sales-points/:id", () => {
    return new HttpResponse(null, { status: 204 });
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

  http.get("/api/sales-points", () => {
    return HttpResponse.json({ salesPoints: mockSalesPoints.filter((point) => point.published) });
  }),
];
