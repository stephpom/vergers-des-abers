import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../utils";
import AdminHeader from "@/components/admin/AdminHeader";

describe("AdminHeader", () => {
  it("rend le titre", () => {
    renderWithProviders(<AdminHeader title="Administration" />);
    expect(screen.getByRole("heading", { name: "Administration" })).toBeInTheDocument();
  });

  it("rend leftAction si fourni", () => {
    renderWithProviders(<AdminHeader title="Test" leftAction={<button>Retour</button>} />);
    expect(screen.getByRole("button", { name: "Retour" })).toBeInTheDocument();
  });

  it("pas de placeholder texte si leftAction absent", () => {
    const { container } = renderWithProviders(<AdminHeader title="Test" />);
    // Seul le h1 doit être visible, pas de contenu non désiré à gauche
    expect(screen.getByRole("heading", { name: "Test" })).toBeInTheDocument();
    // Le container doit avoir la zone gauche vide (div placeholder)
    const placeholders = container.querySelectorAll(".w-20");
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it("rend rightAction si fourni", () => {
    renderWithProviders(<AdminHeader title="Test" rightAction={<button>Déconnexion</button>} />);
    expect(screen.getByRole("button", { name: "Déconnexion" })).toBeInTheDocument();
  });

  it("a les classes sticky top-0 backdrop-blur sur le container header", () => {
    const { container } = renderWithProviders(<AdminHeader title="Test" />);
    const header = container.querySelector("header");
    expect(header).not.toBeNull();
    expect(header!.className).toContain("sticky");
    expect(header!.className).toContain("top-0");
    expect(header!.className).toContain("backdrop-blur");
  });
});
