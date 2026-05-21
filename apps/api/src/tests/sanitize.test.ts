import { describe, it, expect } from 'vitest';
import { createProduct } from '../services/product.service.js';

describe('Sanitize HTML dans createProduct', () => {
  it("supprime les balises <script>", async () => {
    const product = await createProduct({
      title: 'XSS script',
      description: '<p>Texte</p><script>alert(1)</script>',
    });
    expect(product.description).not.toContain('<script>');
    expect(product.description).toContain('Texte');
  });

  it("retire les href javascript:", async () => {
    const product = await createProduct({
      title: 'XSS href',
      description: '<a href="javascript:void(0)">x</a>',
    });
    // sanitize-html supprime les schémas non autorisés, le lien est retiré ou vide
    expect(product.description).not.toContain('javascript:');
  });

  it("préserve les balises HTML sûres (<p>, <strong>, <ul><li>)", async () => {
    const product = await createProduct({
      title: 'HTML safe',
      description: '<p>Intro</p><strong>Gras</strong><ul><li>Item</li></ul>',
    });
    expect(product.description).toContain('<p>');
    expect(product.description).toContain('<strong>');
    expect(product.description).toContain('<ul>');
    expect(product.description).toContain('<li>');
  });

  it("préserve les liens https et ajoute rel + target", async () => {
    const product = await createProduct({
      title: 'Lien externe',
      description: '<a href="https://example.com">Voir</a>',
    });
    expect(product.description).toContain('href="https://example.com"');
    expect(product.description).toContain('rel="noopener noreferrer"');
    expect(product.description).toContain('target="_blank"');
  });
});
