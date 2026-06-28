import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { stripHtml, truncate, absoluteUrl } from "@/lib/seo";

describe("lib/seo", () => {
  describe("stripHtml", () => {
    it("retire les balises <p>, <strong>, <em>, etc.", () => {
      expect(stripHtml("<p>Bonjour <strong>monde</strong></p>")).toBe("Bonjour monde");
      expect(stripHtml("<em>Italique</em> et <b>gras</b>")).toBe("Italique et gras");
    });

    it("compresse les whitespaces multiples", () => {
      expect(stripHtml("<p>Texte   avec   espaces</p>")).toBe("Texte avec espaces");
      expect(stripHtml("<p>Ligne 1</p>\n<p>Ligne 2</p>")).toBe("Ligne 1 Ligne 2");
    });

    it("renvoie string vide pour input vide", () => {
      expect(stripHtml("")).toBe("");
    });
  });

  describe("truncate", () => {
    it("renvoie tel quel si plus court que max", () => {
      expect(truncate("Bonjour", 50)).toBe("Bonjour");
      expect(truncate("Exactement", 10)).toBe("Exactement");
    });

    it("coupe et ajoute … si plus long", () => {
      const result = truncate("Un texte assez long pour être coupé", 15);
      expect(result.length).toBeLessThanOrEqual(15);
      expect(result.endsWith("…")).toBe(true);
    });
  });

  describe("absoluteUrl", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_PUBLIC_SITE_URL", "https://pompom.fr");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("préfixe avec VITE_PUBLIC_SITE_URL", () => {
      expect(absoluteUrl("/produits/jus-de-pomme")).toBe("https://pompom.fr/produits/jus-de-pomme");
    });

    it("gère slash final dans la base", () => {
      vi.stubEnv("VITE_PUBLIC_SITE_URL", "https://pompom.fr/");
      expect(absoluteUrl("/contact")).toBe("https://pompom.fr/contact");
    });
  });
});
