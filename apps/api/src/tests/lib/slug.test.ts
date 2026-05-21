import { describe, it, expect } from 'vitest';
import { slugify } from '../../lib/slug.js';

describe('slugify', () => {
  it("transforme une phrase en slug basique", () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it("gère les caractères accentués et normalise les caractères non-alphanum", () => {
    // L'apostrophe est un caractère non-alphanum → remplacé par un tiret
    expect(slugify("Pommes Bio à l'ancienne")).toBe('pommes-bio-a-l-ancienne');
  });

  it("retourne une chaîne vide pour une entrée vide ou que tirets/espaces", () => {
    expect(slugify('   ---   ')).toBe('');
  });

  it("tronque à 80 caractères", () => {
    expect(slugify('A'.repeat(200))).toHaveLength(80);
  });

  it("gère les caractères spéciaux et l'esperluette", () => {
    expect(slugify('Café & Crème')).toBe('cafe-creme');
  });
});
