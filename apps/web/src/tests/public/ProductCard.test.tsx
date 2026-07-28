import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/tests/utils";
import { ProductCard } from "@/components/ProductCard";
import type { ApiProduct } from "@/types/api";

function makeProduct(overrides: Partial<ApiProduct> = {}): ApiProduct {
  return {
    id: "prod-1",
    title: "Jus de Pomme",
    slug: "jus-de-pomme",
    description: "<p>Description</p>",
    category: "JUICE",
    formats: ["L_1"],
    published: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    images: [],
    ...overrides,
  };
}

describe("Composant ProductCard", () => {
  it('affiche l\'image avec src /uploads/filename, alt et loading="lazy"', () => {
    const product = makeProduct({
      images: [{ id: "img-1", filename: "pomme.jpg", alt: "Belle pomme", position: 0 }],
    });
    renderWithProviders(<ProductCard product={product} />);
    const img = screen.getByRole("img", { name: "Belle pomme" });
    expect(img).toHaveAttribute("src", "/uploads/pomme.jpg");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it('affiche le fallback "Pas d\'image" quand images est vide', () => {
    renderWithProviders(<ProductCard product={makeProduct({ images: [] })} />);
    expect(screen.getByText(/pas d'image/i)).toBeInTheDocument();
  });

  it("le lien navigue vers /produits/:slug", () => {
    renderWithProviders(<ProductCard product={makeProduct()} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/produits/jus-de-pomme");
  });

  it("le lien a un focus visible (focus-visible:ring-2)", () => {
    renderWithProviders(<ProductCard product={makeProduct()} />);
    expect(screen.getByRole("link")).toHaveClass("focus-visible:ring-2");
  });

  it("affiche le titre du produit", () => {
    renderWithProviders(<ProductCard product={makeProduct()} />);
    expect(screen.getByRole("heading", { name: "Jus de Pomme" })).toBeInTheDocument();
  });

  it("n'affiche aucun prix (vitrine sans vente)", () => {
    const { container } = renderWithProviders(<ProductCard product={makeProduct()} />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/€|EUR|\$|ajouter au panier/i);
  });
});
