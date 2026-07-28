import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders, mockAuthenticated } from "../utils";
import AdminHome from "@/pages/admin/Home";

function renderAdminHome() {
  mockAuthenticated();
  return renderWithProviders(
    <Routes>
      <Route path="/admin" element={<AdminHome />} />
      <Route path="/admin/produits" element={<div>Page produits</div>} />
      <Route path="/admin/points-de-vente" element={<div>Page points de vente</div>} />
      <Route path="/admin/login" element={<div>Page login</div>} />
    </Routes>,
    { initialEntries: ["/admin"] },
  );
}

describe("Admin home", () => {
  it("affiche un menu pour accéder aux produits et aux points de vente", () => {
    renderAdminHome();

    expect(screen.getByRole("heading", { name: /administration/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /produits/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /points de vente/i })).toBeInTheDocument();
  });
});
