import { describe, expect, it } from "vitest";
import { salesPointCity, sortSalesPointsByCityAndName } from "../services/sales-point.service.js";

describe("tri des points de vente", () => {
  it("extrait la ville placée après le code postal", () => {
    expect(salesPointCity("12 rue du Port, 29200 Brest")).toBe("Brest");
  });

  it("utilise la dernière partie de l'adresse sans code postal", () => {
    expect(salesPointCity("12 rue du Port, Plouguerneau")).toBe("Plouguerneau");
  });

  it("trie par ville puis par nom sans tenir compte des accents ou de la casse", () => {
    const points = [
      { name: "Z Marché", address: "2 rue Haute, 29200 Brest" },
      { name: "À la ferme", address: "1 rue Basse, 29200 Brest" },
      { name: "Épicerie", address: "3 rue du Port, 29870 Lannilis" },
    ];

    expect(sortSalesPointsByCityAndName(points).map((point) => point.name)).toEqual([
      "À la ferme",
      "Z Marché",
      "Épicerie",
    ]);
  });
});
