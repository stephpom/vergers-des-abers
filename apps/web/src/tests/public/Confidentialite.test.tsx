import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/tests/utils";
import Confidentialite from "@/pages/Confidentialite";

describe("Page Confidentialite", () => {
  it("affiche le titre principal", () => {
    renderWithProviders(<Confidentialite />, { initialEntries: ["/confidentialite"] });
    expect(
      screen.getByRole("heading", { name: /politique de confidentialité/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it("expose les rubriques RGPD obligatoires", () => {
    renderWithProviders(<Confidentialite />, { initialEntries: ["/confidentialite"] });
    expect(screen.getByRole("heading", { name: /données collectées/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /finalité/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /durée de conservation/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /vos droits/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /cookies/i })).toBeInTheDocument();
  });

  it("affiche les informations légales", () => {
    renderWithProviders(<Confidentialite />, { initialEntries: ["/confidentialite"] });
    expect(screen.getByText(/Stéphane Pommier - Terre de jeux/i)).toBeInTheDocument();
    expect(screen.getByText(/3 ans à compter du dernier échange/i)).toBeInTheDocument();
  });
});
