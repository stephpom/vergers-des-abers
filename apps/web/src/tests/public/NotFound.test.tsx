import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/tests/utils";
import NotFound from "@/pages/NotFound";

describe("Page NotFound", () => {
  it('affiche "404"', () => {
    renderWithProviders(<NotFound />, { initialEntries: ["/page-inconnue"] });
    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
  });

  it('affiche un lien de retour vers "/"', () => {
    renderWithProviders(<NotFound />, { initialEntries: ["/page-inconnue"] });
    const link = screen.getByRole("link", { name: /retour à l'accueil/i });
    expect(link).toHaveAttribute("href", "/");
  });

  it("inclut le PublicHeader et le PublicFooter", () => {
    renderWithProviders(<NotFound />, { initialEntries: ["/page-inconnue"] });
    expect(screen.getByRole("banner")).toBeInTheDocument(); // header
    expect(screen.getByRole("contentinfo")).toBeInTheDocument(); // footer
  });
});
