import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import NotreHistoire from "@/pages/NotreHistoire";
import { renderWithProviders } from "@/tests/utils";

describe("Page NotreHistoire", () => {
  it("présente l'histoire du verger et Stéphane Pommier", () => {
    renderWithProviders(<NotreHistoire />, { initialEntries: ["/notre-histoire"] });

    expect(
      screen.getByRole("heading", { name: /des vergers vivants au cœur des abers/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /je suis stéphane pommier/i })).toBeInTheDocument();
  });

  it("met en avant les engagements pour la biodiversité", () => {
    renderWithProviders(<NotreHistoire />, { initialEntries: ["/notre-histoire"] });

    expect(screen.getByRole("heading", { name: /laisser fleurir/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /cultiver en bio/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /observer avant d'agir/i })).toBeInTheDocument();
  });

  it("affiche les photographies du verger avec des descriptions accessibles", () => {
    renderWithProviders(<NotreHistoire />, { initialEntries: ["/notre-histoire"] });

    expect(screen.getByAltText(/observant les pommiers/i)).toBeInTheDocument();
    expect(screen.getByAltText(/pollinisateur butinant/i)).toBeInTheDocument();
    expect(screen.getByAltText(/bouteille de jus pom'pom/i)).toBeInTheDocument();
  });
});
