import path from 'node:path';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import staticPlugin from '@fastify/static';
import { config } from './config.js';
import { authRoutes } from './routes/auth.routes.js';
import { productsRoutes } from './routes/products.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { contactRoutes } from './routes/contact.routes.js';
import { sitemapRoutes } from './routes/sitemap.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger:
      config.NODE_ENV === 'development'
        ? { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } } }
        : true,
    trustProxy: true,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: config.CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  });
  await app.register(cookie);
  await app.register(multipart, {
    limits: { fileSize: config.MAX_UPLOAD_SIZE_MB * 1024 * 1024, files: 1 },
  });
  await app.register(staticPlugin, {
    root: path.resolve(config.UPLOAD_DIR),
    prefix: '/uploads/',
    decorateReply: false,
  });
  await app.register(rateLimit, { global: false });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(sitemapRoutes);
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(productsRoutes, { prefix: '/api/products' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(contactRoutes, { prefix: '/api/contact' });

  return app;
}
