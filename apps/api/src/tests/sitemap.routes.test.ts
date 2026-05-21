import { afterAll, beforeAll, describe, it, expect } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, createTestProduct } from './helpers.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

describe('GET /sitemap.xml', () => {
  it('retourne 200 + Content-Type application/xml', async () => {
    const res = await app.inject({ method: 'GET', url: '/sitemap.xml' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/xml/);
  });

  it("contient l'URL racine du site avec priority 1.0", async () => {
    const res = await app.inject({ method: 'GET', url: '/sitemap.xml' });
    const body = res.body;
    expect(body).toContain('<priority>1.0</priority>');
    expect(body).toContain('<changefreq>weekly</changefreq>');
  });

  it('contient /contact avec priority 0.5', async () => {
    const res = await app.inject({ method: 'GET', url: '/sitemap.xml' });
    const body = res.body;
    expect(body).toContain('/contact</loc>');
    expect(body).toContain('<priority>0.5</priority>');
    expect(body).toContain('<changefreq>yearly</changefreq>');
  });

  it('contient une <url> par produit publié, pas pour les brouillons', async () => {
    await createTestProduct({ title: 'Publié 1', slug: 'publie-1', published: true });
    await createTestProduct({ title: 'Publié 2', slug: 'publie-2', published: true });
    await createTestProduct({ title: 'Brouillon', slug: 'brouillon', published: false });

    const res = await app.inject({ method: 'GET', url: '/sitemap.xml' });
    const body = res.body;
    expect(body).toContain('/produits/publie-1</loc>');
    expect(body).toContain('/produits/publie-2</loc>');
    expect(body).not.toContain('/produits/brouillon</loc>');
  });

  it('contient lastmod au format YYYY-MM-DD pour chaque produit publié', async () => {
    await createTestProduct({ title: 'Avec lastmod', slug: 'avec-lastmod', published: true });

    const res = await app.inject({ method: 'GET', url: '/sitemap.xml' });
    const body = res.body;
    // Vérifie le format YYYY-MM-DD (ex: 2024-01-15)
    const lastmodMatches = body.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g);
    expect(lastmodMatches).not.toBeNull();
    expect(lastmodMatches!.length).toBeGreaterThanOrEqual(1);
  });

  it('le XML est valide (structure urlset + url + loc)', async () => {
    const res = await app.inject({ method: 'GET', url: '/sitemap.xml' });
    const body = res.body;
    // Déclaration XML
    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    // Namespace sitemaps
    expect(body).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    // Balises ouvrantes/fermantes urlset
    expect(body).toContain('<urlset');
    expect(body).toContain('</urlset>');
    // Chaque bloc <url> contient au moins un <loc>
    const urlBlocks = body.match(/<url>[\s\S]*?<\/url>/g);
    expect(urlBlocks).not.toBeNull();
    for (const block of urlBlocks!) {
      expect(block).toContain('<loc>');
      expect(block).toContain('</loc>');
    }
  });

  it('utilise PUBLIC_SITE_URL en préfixe pour toutes les loc', async () => {
    const expectedBase = process.env.PUBLIC_SITE_URL ?? 'http://localhost:5173';
    const res = await app.inject({ method: 'GET', url: '/sitemap.xml' });
    const body = res.body;
    const locMatches = body.match(/<loc>(.*?)<\/loc>/g);
    expect(locMatches).not.toBeNull();
    for (const loc of locMatches!) {
      expect(loc).toMatch(new RegExp(`<loc>${expectedBase.replace(/\/$/, '')}`));
    }
  });
});
