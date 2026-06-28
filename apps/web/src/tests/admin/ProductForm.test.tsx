import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { renderWithProviders, mockAuthenticated } from "../utils";
import AdminProductForm from "@/pages/admin/ProductForm";
import { Routes, Route } from "react-router-dom";
import type { ApiProduct } from "@/types/api";

const mockProduct: ApiProduct = {
  id: "abc",
  title: "Pomme Existante",
  slug: "pomme-existante",
  description: "<p>Une belle pomme</p>",
  published: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  images: [{ id: "img-1", filename: "pomme.jpg", alt: "Pomme", position: 0 }],
};

function renderCreate() {
  mockAuthenticated();
  return renderWithProviders(
    <Routes>
      <Route path="/admin/produits/nouveau" element={<AdminProductForm />} />
      <Route path="/admin/produits/:id" element={<AdminProductForm />} />
      <Route path="/admin/produits" element={<div>Liste produits</div>} />
    </Routes>,
    { initialEntries: ["/admin/produits/nouveau"] },
  );
}

function renderEdit(id = "abc") {
  mockAuthenticated();
  server.use(
    http.get(`/api/admin/products/${id}`, () => HttpResponse.json({ product: mockProduct })),
  );
  return renderWithProviders(
    <Routes>
      <Route path="/admin/produits/:id" element={<AdminProductForm />} />
      <Route path="/admin/produits/nouveau" element={<AdminProductForm />} />
      <Route path="/admin/produits" element={<div>Liste produits</div>} />
    </Routes>,
    { initialEntries: [`/admin/produits/${id}`] },
  );
}

describe("Admin ProductForm — mode création", () => {
  it("champs vides au mount", async () => {
    server.use(
      http.get("/api/admin/products/nouveau", () =>
        HttpResponse.json({ error: "Not found" }, { status: 404 }),
      ),
    );
    renderCreate();
    await waitFor(() => {
      expect(screen.getByLabelText("Titre")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Titre")).toHaveValue("");
    expect(screen.getByLabelText(/slug/i)).toHaveValue("");
  });

  it("soumission sans titre → erreur zod, pas d'appel réseau", async () => {
    const user = userEvent.setup();
    let postCalled = false;
    server.use(
      http.post("/api/admin/products", () => {
        postCalled = true;
        return HttpResponse.json({});
      }),
    );
    renderCreate();
    await waitFor(() => expect(screen.getByRole("button", { name: /créer/i })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /créer/i }));
    await waitFor(() => {
      expect(screen.getByText("Titre requis")).toBeInTheDocument();
    });
    expect(postCalled).toBe(false);
  });

  it("soumission valide → POST /api/admin/products + redirect vers /admin/produits/:newId", async () => {
    const user = userEvent.setup();
    let postBody: unknown;
    server.use(
      http.post("/api/admin/products", async ({ request }) => {
        postBody = await request.json();
        return HttpResponse.json(
          {
            product: { ...mockProduct, id: "prod-new", title: "Nouvelle Pomme" },
          },
          { status: 201 },
        );
      }),
      http.get("/api/admin/products/prod-new", () =>
        HttpResponse.json({ product: { ...mockProduct, id: "prod-new" } }),
      ),
    );
    renderCreate();
    await waitFor(() => expect(screen.getByLabelText("Titre")).toBeInTheDocument());
    await user.type(screen.getByLabelText("Titre"), "Nouvelle Pomme");
    await user.click(screen.getByRole("button", { name: /créer/i }));
    await waitFor(() => {
      expect(postBody).toMatchObject({ title: "Nouvelle Pomme" });
    });
    // Après création, redirige vers /admin/produits/prod-new (mode édition)
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /créer/i })).not.toBeInTheDocument();
    });
  });
});

describe("Admin ProductForm — mode édition", () => {
  it("GET /api/admin/products/:id au mount + form pré-rempli", async () => {
    renderEdit();
    await waitFor(() => {
      expect(screen.getByDisplayValue("Pomme Existante")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("pomme-existante")).toBeInTheDocument();
  });

  it("switch Publié toggle", async () => {
    const user = userEvent.setup();
    renderEdit();
    await waitFor(() =>
      expect(screen.getByRole("switch", { name: /publié/i })).toBeInTheDocument(),
    );
    const switchEl = screen.getByRole("switch", { name: /publié/i });
    // Le produit est publié → switch checked
    expect(switchEl).toHaveAttribute("aria-checked", "true");
    await user.click(switchEl);
    await waitFor(() => {
      expect(switchEl).toHaveAttribute("aria-checked", "false");
    });
  });

  it("soumission → PATCH /api/admin/products/:id", async () => {
    const user = userEvent.setup();
    let patchCalled = false;
    let patchBody: unknown;
    server.use(
      http.patch("/api/admin/products/abc", async ({ request }) => {
        patchCalled = true;
        patchBody = await request.json();
        return HttpResponse.json({ product: mockProduct });
      }),
    );
    renderEdit();
    await waitFor(() => expect(screen.getByDisplayValue("Pomme Existante")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /enregistrer/i }));
    await waitFor(() => {
      expect(patchCalled).toBe(true);
      expect(patchBody).toMatchObject({ title: "Pomme Existante" });
    });
  });

  it("section images visible en mode édition", async () => {
    renderEdit();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /images/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /ajouter une image/i })).toBeInTheDocument();
  });

  it("click Supprimer l'image → DELETE /api/admin/products/:id/images/:imageId", async () => {
    const user = userEvent.setup();
    let deleteCalled = false;
    server.use(
      http.delete("/api/admin/products/abc/images/img-1", () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderEdit();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /supprimer l'image/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /supprimer l'image/i }));
    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
  });
});
