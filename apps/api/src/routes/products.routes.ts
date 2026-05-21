import type { FastifyInstance } from 'fastify';
import { getPublishedProductBySlug, listPublishedProducts } from '../services/product.service.js';

export async function productsRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const products = await listPublishedProducts();
    return { products };
  });

  app.get<{ Params: { slug: string } }>('/:slug', async (req, reply) => {
    const product = await getPublishedProductBySlug(req.params.slug);
    if (!product) return reply.code(404).send({ error: 'Not found' });
    return { product };
  });
}
