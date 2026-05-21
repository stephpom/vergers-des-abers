import type { FastifyInstance, InjectOptions } from 'fastify';
import { buildApp } from '../app.js';
import { hashPassword } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import type { CreateProductInput } from '../services/product.service.js';
import { createProduct } from '../services/product.service.js';

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  await app.ready();
  return app;
}

export async function createTestUser(
  email: string,
  password: string,
): Promise<{ id: string; email: string }> {
  const hashed = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, password: hashed } });
  return { id: user.id, email: user.email };
}

export async function createTestProduct(
  overrides: Partial<CreateProductInput> = {},
): Promise<{ id: string; slug: string; title: string }> {
  const input: CreateProductInput = {
    title: 'Produit test',
    description: '<p>Description de test</p>',
    published: false,
    ...overrides,
  };
  const product = await createProduct(input);
  return { id: product.id, slug: product.slug, title: product.title };
}

export async function loginCookie(
  app: FastifyInstance,
  email: string,
  password: string,
): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password },
  });
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) throw new Error('Pas de cookie set-cookie dans la réponse login');
  return Array.isArray(setCookie) ? setCookie[0] : setCookie;
}

export async function authedInject(
  app: FastifyInstance,
  options: InjectOptions,
  cookie: string,
): ReturnType<FastifyInstance['inject']> {
  return app.inject({
    ...options,
    headers: {
      ...(options.headers ?? {}),
      cookie,
    },
  });
}
