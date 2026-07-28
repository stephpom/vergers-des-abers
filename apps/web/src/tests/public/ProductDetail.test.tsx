import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { renderWithProviders } from "@/tests/utils";
import ProductDetail from "@/pages/ProductDetail";
import type { ApiProduct } from "@/types/api";

function makeProduct(overrides: Partial<ApiProduct> = {}): ApiProduct {
  return {
    id: "prod-1",
    title: "Jus de Pomme",
    slug: "jus-de-pomme",
    description: "<p>Un délicieux jus</p>",
    category: "JUICE",
    formats: ["L_1"],
    published: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    images: [],
    ...overrides,
  };
}

function renderDetail(slug = "jus-de-pomme") {
  return renderWithProviders(<ProductDetail />, {
    initialEntries: [`/produits/${slug}`],
    routePath: "/produits/:slug",
  });
}

describe("Page ProductDetail", () => {
  it("affiche un loader pendant le fetch", async () => {
    server.use(
      http.get("/api/products/jus-de-pomme", async () => {
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json({ product: makeProduct() });
      }),
    );
    renderDetail();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it('affiche "Produit introuvable" et lien retour sur 404', async () => {
    server.use(
      http.get("/api/products/inconnu", () =>
        HttpResponse.json({ error: "Not found" }, { status: 404 }),
      ),
    );
    renderDetail("inconnu");
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /produit introuvable/i })).toBeInTheDocument();
    });
    const link = screen.getByRole("link", { name: /retour à l'accueil/i });
    expect(link).toHaveAttribute("href", "/");
  });

  it('affiche "Description à venir." quand la description est vide', async () => {
    server.use(
      http.get("/api/products/jus-de-pomme", () =>
        HttpResponse.json({ product: makeProduct({ description: "" }) }),
      ),
    );
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/description à venir/i)).toBeInTheDocument();
    });
  });

  it("rend la description HTML via dangerouslySetInnerHTML", async () => {
    server.use(
      http.get("/api/products/jus-de-pomme", () =>
        HttpResponse.json({ product: makeProduct({ description: "<p>Contenu riche</p>" }) }),
      ),
    );
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText("Contenu riche")).toBeInTheDocument();
    });
  });

  it("affiche l'image principale et pas de grille thumbnails avec 1 image", async () => {
    const product = makeProduct({
      images: [{ id: "img-1", filename: "cover.jpg", alt: "Couverture", position: 0 }],
    });
    server.use(http.get("/api/products/jus-de-pomme", () => HttpResponse.json({ product })));
    renderDetail();
    await waitFor(() => {
      expect(screen.getByAltText("Couverture")).toBeInTheDocument();
    });
    // 1 seule image → pas de grille thumbnails (condition `images.length > 1`)
    expect(screen.queryByRole("button", { name: /voir l'image/i })).toBeNull();
  });

  it("affiche l'image principale + 3 thumbnails cliquables avec 3 images", async () => {
    const product = makeProduct({
      images: [
        { id: "img-1", filename: "cover.jpg", alt: "Couverture", position: 0 },
        { id: "img-2", filename: "thumb1.jpg", alt: "Miniature 1", position: 1 },
        { id: "img-3", filename: "thumb2.jpg", alt: "Miniature 2", position: 2 },
      ],
    });
    server.use(http.get("/api/products/jus-de-pomme", () => HttpResponse.json({ product })));
    renderDetail();
    // image principale (l'image de couverture est à la fois affichée en grand ET en thumbnail)
    await waitFor(() => {
      expect(screen.getAllByAltText("Couverture")).toHaveLength(2);
    });
    expect(screen.getByAltText("Miniature 1")).toBeInTheDocument();
    expect(screen.getByAltText("Miniature 2")).toBeInTheDocument();
    // 3 thumbnails cliquables (boutons aria-label `Voir l'image N`)
    expect(screen.getAllByRole("button", { name: /voir l'image/i })).toHaveLength(3);
  });

  it("cliquer sur une thumbnail change l'image principale affichée", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const product = makeProduct({
      images: [
        { id: "img-1", filename: "cover.jpg", alt: "Image 1", position: 0 },
        { id: "img-2", filename: "thumb1.jpg", alt: "Image 2", position: 1 },
      ],
    });
    server.use(http.get("/api/products/jus-de-pomme", () => HttpResponse.json({ product })));
    renderDetail();
    await waitFor(() => {
      expect(screen.getAllByAltText("Image 1")).toHaveLength(2);
    });
    // Avant clic : la principale est "Image 1" (2 occurrences : principale + thumbnail)
    // "Image 2" n'apparaît qu'1 fois (thumbnail seul)
    expect(screen.getAllByAltText("Image 2")).toHaveLength(1);

    const user = userEvent.setup();
    const thumb2 = screen.getByRole("button", { name: "Voir l'image 2" });
    await user.click(thumb2);

    // Après clic : "Image 2" doit apparaître 2 fois (principale + thumbnail)
    await waitFor(() => {
      expect(screen.getAllByAltText("Image 2")).toHaveLength(2);
    });
  });

  it('affiche le fallback "Pas d\'image" quand images est vide', async () => {
    server.use(
      http.get("/api/products/jus-de-pomme", () =>
        HttpResponse.json({ product: makeProduct({ images: [] }) }),
      ),
    );
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/pas d'image/i)).toBeInTheDocument();
    });
  });

  it("affiche un breadcrumb retour vers la section produits de la home", async () => {
    server.use(
      http.get("/api/products/jus-de-pomme", () => HttpResponse.json({ product: makeProduct() })),
    );
    renderDetail();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Jus de Pomme" })).toBeInTheDocument();
    });
    const backLink = screen.getByRole("link", { name: /retour à nos produits/i });
    expect(backLink).toHaveAttribute("href", "/#products");
  });
});
