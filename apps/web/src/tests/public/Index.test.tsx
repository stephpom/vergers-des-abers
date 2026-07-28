import { describe, it, expect } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { renderWithProviders } from "@/tests/utils";
import Index from "@/pages/Index";

function renderIndex() {
  return renderWithProviders(<Index />, { initialEntries: ["/"] });
}

describe("Page Index", () => {
  describe("Header", () => {
    it("affiche le logo avec alt Pom'Pom Logo", async () => {
      renderIndex();
      const logos = screen.getAllByAltText("Pom'Pom Logo");
      expect(logos.length).toBeGreaterThan(0);
    });

    it("affiche le label AB avec alt Agriculture Biologique", async () => {
      renderIndex();
      // Plusieurs instances du label AB (header + section About via ABLabel)
      const labels = screen.getAllByAltText("Label Agriculture Biologique");
      expect(labels.length).toBeGreaterThan(0);
    });

    it("affiche le bouton Contact avec lien vers /contact", async () => {
      renderIndex();
      const link = screen.getByRole("link", { name: /contact/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/contact");
    });

    it('contient un skip link "Aller au contenu principal" vers #main-content', () => {
      renderIndex();
      const skip = screen.getByRole("link", { name: /aller au contenu principal/i });
      expect(skip).toHaveAttribute("href", "#main-content");
    });

    it('enveloppe le contenu dans un <main id="main-content">', () => {
      renderIndex();
      const main = document.getElementById("main-content");
      expect(main).not.toBeNull();
      expect(main?.tagName).toBe("MAIN");
    });
  });

  describe("Section Hero", () => {
    it('affiche le CTA "Voir nos produits" avec ancre #products', async () => {
      renderIndex();
      const cta = screen.getByRole("link", { name: /voir nos produits/i });
      expect(cta).toBeInTheDocument();
      expect(cta).toHaveAttribute("href", "#products");
    });

    it("le CTA Hero a un focus visible (focus-visible:ring-2)", () => {
      renderIndex();
      const cta = screen.getByRole("link", { name: /voir nos produits/i });
      expect(cta).toHaveClass("focus-visible:ring-2");
    });
  });

  describe("Sections statiques", () => {
    it('affiche la section "Nos Vergers des Abers"', async () => {
      renderIndex();
      expect(screen.getByRole("heading", { name: /nos vergers des abers/i })).toBeInTheDocument();
    });

    it('affiche la section "Notre Savoir-Faire" avec 6 étapes', async () => {
      renderIndex();
      expect(screen.getByRole("heading", { name: /notre savoir-faire/i })).toBeInTheDocument();
      const etapes = [
        /choix des variétés/i,
        /taille douce/i,
        /fauchage tardif/i,
        /ramassage à la main/i,
        /pressage à froid/i,
        /mise en bouteille/i,
      ];
      for (const etape of etapes) {
        expect(screen.getByRole("heading", { name: etape })).toBeInTheDocument();
      }
    });

    it('affiche la section galerie "Nos Vergers en Images"', async () => {
      renderIndex();
      expect(screen.getByRole("heading", { name: /nos vergers en images/i })).toBeInTheDocument();
    });
  });

  describe("Section produits", () => {
    it("affiche des skeletons pendant le fetch", async () => {
      server.use(
        http.get("/api/products", async () => {
          await new Promise((r) => setTimeout(r, 200));
          return HttpResponse.json({ products: [] });
        }),
      );
      renderIndex();
      expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it('affiche "Pas encore de produits" quand la liste est vide', async () => {
      server.use(http.get("/api/products", () => HttpResponse.json({ products: [] })));
      renderIndex();
      await waitFor(() => {
        expect(screen.getByText(/pas encore de produits/i)).toBeInTheDocument();
      });
    });

    it("rend 2 ProductCard quand 2 produits sont retournés", async () => {
      const user = userEvent.setup();
      server.use(
        http.get("/api/products", () =>
          HttpResponse.json({
            products: [
              {
                id: "p1",
                title: "Jus de Pomme",
                slug: "jus-de-pomme",
                description: "",
                category: "JUICE",
                formats: ["L_1"],
                published: true,
                createdAt: "",
                updatedAt: "",
                images: [],
              },
              {
                id: "p2",
                title: "Kéfir Citron",
                slug: "kefir-citron",
                description: "",
                category: "KEFIR",
                formats: ["CL_33"],
                published: true,
                createdAt: "",
                updatedAt: "",
                images: [],
              },
            ],
          }),
        ),
      );
      renderIndex();
      await waitFor(() => {
        expect(screen.getByText("Jus de Pomme")).toBeInTheDocument();
        expect(screen.getByText("Kéfir Citron")).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: "33 cl" }));
      expect(screen.queryByText("Jus de Pomme")).not.toBeInTheDocument();
      expect(screen.getByText("Kéfir Citron")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Tous" }));
      expect(screen.getByText("Jus de Pomme")).toBeInTheDocument();
    });

    it("affiche un message d'erreur réseau si l'API est indisponible (500)", async () => {
      server.use(http.get("/api/products", () => new HttpResponse(null, { status: 500 })));
      renderIndex();
      await waitFor(() => {
        expect(screen.getByText(/impossible de charger les produits/i)).toBeInTheDocument();
      });
      expect(screen.queryByText(/pas encore de produits/i)).not.toBeInTheDocument();
    });
  });

  describe("Footer", () => {
    it("contient le copyright avec l'année courante", async () => {
      renderIndex();
      const year = new Date().getFullYear().toString();
      const footer = document.querySelector("footer");
      expect(footer).not.toBeNull();
      expect(within(footer!).getByText(new RegExp(year))).toBeInTheDocument();
    });
  });
});
