import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/tests/utils";
import MentionsLegales from "@/pages/MentionsLegales";

describe("Page MentionsLegales", () => {
  it("affiche le titre principal", () => {
    renderWithProviders(<MentionsLegales />, { initialEntries: ["/mentions-legales"] });
    expect(
      screen.getByRole("heading", { name: /mentions légales/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it("expose les rubriques obligatoires (éditeur, hébergeur, directeur de publication, contact)", () => {
    renderWithProviders(<MentionsLegales />, { initialEntries: ["/mentions-legales"] });
    expect(screen.getByRole("heading", { name: /éditeur/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /hébergeur/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /directeur de publication/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /contact/i })).toBeInTheDocument();
  });

  it("affiche les informations légales", () => {
    renderWithProviders(<MentionsLegales />, { initialEntries: ["/mentions-legales"] });
    expect(screen.getByText(/90501504600014/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pom-pom@mailo\.com/i })).toBeInTheDocument();
  });
});
