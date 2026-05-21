import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';

export async function sitemapRoutes(app: FastifyInstance) {
  app.get('/sitemap.xml', async (_req, reply) => {
    const products = await prisma.product.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    const base = config.PUBLIC_SITE_URL.replace(/\/$/, '');
    const today = new Date().toISOString().slice(0, 10);

    const urls = [
      { loc: `${base}/`, lastmod: today, changefreq: 'weekly', priority: '1.0' },
      { loc: `${base}/contact`, lastmod: today, changefreq: 'yearly', priority: '0.5' },
      ...products.map((p) => ({
        loc: `${base}/produits/${p.slug}`,
        lastmod: p.updatedAt.toISOString().slice(0, 10),
        changefreq: 'monthly',
        priority: '0.8',
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

    reply.type('application/xml; charset=utf-8').send(xml);
  });
}
