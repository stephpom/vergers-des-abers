import { describe, it, expect } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { renderWithProviders, mockAuthenticated } from "../utils";
import AdminProducts from "@/pages/admin/Products";
import { Routes, Route } from "react-router-dom";
import type { ApiProduct } from "@/types/api";

function renderProducts() {
  mockAuthenticated();
  return renderWithProviders(
    <Routes>
      <Route path="/admin/produits" element={<AdminProducts />} />
      <Route path="/admin/produits/nouveau" element={<div>Nouveau produit</div>} />
      <Route path="/admin/produits/:id" element={<div>Modifier produit</div>} />
      <Route path="/admin/login" element={<div>Page login</div>} />
    </Routes>,
    { initialEntries: ["/admin/produits"] },
  );
}

describe("Admin Products", () => {
  it("affiche un loader pendant le fetch", async () => {
    server.use(
      http.get("/api/admin/products", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return HttpResponse.json({ products: [] });
      }),
    );
    renderProducts();
    // Le loader SVG animé doit être présent
    const spinners = document.querySelectorAll("svg");
    expect(spinners.length).toBeGreaterThan(0);
  });

  it('DB vide → affiche "Aucun produit pour l\'instant." + bouton créer', async () => {
    server.use(http.get("/api/admin/products", () => HttpResponse.json({ products: [] })));
    renderProducts();
    await waitFor(() => {
      expect(screen.getByText(/aucun produit pour l'instant/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /créer le premier produit/i })).toBeInTheDocument();
  });

  it("affiche 2 produits avec badges Publié et Brouillon", async () => {
    const products: ApiProduct[] = [
      {
        id: "p1",
        title: "Pomme Golden",
        slug: "pomme-golden",
        description: "",
        category: "JUICE",
        formats: ["L_1"],
        published: true,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        images: [],
      },
      {
        id: "p2",
        title: "Pomme Granny",
        slug: "pomme-granny",
        description: "",
        category: "JAM_JELLY",
        formats: [],
        published: false,
        createdAt: "2024-01-02T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z",
        images: [],
      },
    ];
    server.use(http.get("/api/admin/products", () => HttpResponse.json({ products })));
    renderProducts();
    await waitFor(() => {
      expect(screen.getByText("Pomme Golden")).toBeInTheDocument();
    });
    expect(screen.getByText("Pomme Granny")).toBeInTheDocument();
    expect(screen.getByText("Publié")).toBeInTheDocument();
    expect(screen.getByText("Brouillon")).toBeInTheDocument();
  });

  it("click sur bouton Modifier → navigue vers /admin/produits/:id", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/admin/products", () =>
        HttpResponse.json({
          products: [
            {
              id: "p1",
              title: "Pomme",
              slug: "pomme",
              description: "",
              published: true,
              createdAt: "",
              updatedAt: "",
              images: [],
            },
          ],
        }),
      ),
    );
    renderProducts();
    await waitFor(() => expect(screen.getByText("Pomme")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /modifier/i }));
    await waitFor(() => {
      expect(screen.getByText("Modifier produit")).toBeInTheDocument();
    });
  });

  it("click Supprimer → dialog → confirmer → DELETE /api/admin/products/:id", async () => {
    const user = userEvent.setup();
    let deleteCalled = false;
    server.use(
      http.get("/api/admin/products", () =>
        HttpResponse.json({
          products: [
            {
              id: "p1",
              title: "Pomme",
              slug: "pomme",
              description: "",
              published: true,
              createdAt: "",
              updatedAt: "",
              images: [],
            },
          ],
        }),
      ),
      http.delete("/api/admin/products/p1", () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderProducts();
    await waitFor(() => expect(screen.getByText("Pomme")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /supprimer/i }));
    // AlertDialog ouvert
    await waitFor(() => {
      expect(screen.getByText(/supprimer ce produit/i)).toBeInTheDocument();
    });
    // Clic sur le bouton "Supprimer" dans le dialog (AlertDialogAction)
    const dialog = screen.getByRole("alertdialog");
    const confirmButton = within(dialog).getByRole("button", { name: /supprimer/i });
    await user.click(confirmButton);
    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
  });

  it("click Déconnexion → POST /api/auth/logout + navigate /admin/login", async () => {
    const user = userEvent.setup();
    let logoutCalled = false;
    server.use(
      http.get("/api/admin/products", () => HttpResponse.json({ products: [] })),
      http.post("/api/auth/logout", () => {
        logoutCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderProducts();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /déconnexion/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /déconnexion/i }));
    await waitFor(() => {
      expect(logoutCalled).toBe(true);
      expect(screen.getByText("Page login")).toBeInTheDocument();
    });
  });
});
