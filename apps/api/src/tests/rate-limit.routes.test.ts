import { afterAll, beforeAll, describe, it, expect } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, createTestUser } from './helpers.js';

// Override AVANT buildTestApp pour que la route /login utilise max=5 dans ce fichier
// (le .env.test global force max=1000 pour ne pas casser les autres suites qui font multiples logins).
const ORIGINAL_MAX = process.env.AUTH_LOGIN_RATE_LIMIT_MAX;
process.env.AUTH_LOGIN_RATE_LIMIT_MAX = '5';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
  if (ORIGINAL_MAX === undefined) {
    delete process.env.AUTH_LOGIN_RATE_LIMIT_MAX;
  } else {
    process.env.AUTH_LOGIN_RATE_LIMIT_MAX = ORIGINAL_MAX;
  }
});

describe('Rate limiting POST /api/auth/login', () => {
  it('renvoie 429 après 5 essais échoués + 6e tentative', async () => {
    await createTestUser('ratelimit@test.local', 'correct-password');

    // 5 premiers essais (mauvais mdp) → tous 401
    for (let i = 0; i < 5; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'ratelimit@test.local', password: 'wrong' },
      });
      expect(res.statusCode).toBe(401);
    }

    // 6e essai → 429 (rate limit déclenché)
    const blocked = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'ratelimit@test.local', password: 'wrong' },
    });
    expect(blocked.statusCode).toBe(429);
  });

  it('la réponse 429 contient un header retry-after numérique', async () => {
    await createTestUser('retry@test.local', 'correct-password');

    for (let i = 0; i < 5; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'retry@test.local', password: 'wrong' },
      });
    }
    const blocked = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'retry@test.local', password: 'wrong' },
    });
    expect(blocked.statusCode).toBe(429);
    const retryAfter = blocked.headers['retry-after'];
    expect(retryAfter).toBeTruthy();
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });

  it("POST /api/auth/logout n'est pas rate-limité (preuve que global:false fonctionne)", async () => {
    // /login déjà saturé par les tests précédents (même IP 127.0.0.1, même fenêtre 1 min)
    // → /logout doit quand même répondre normalement
    for (let i = 0; i < 10; i++) {
      const res = await app.inject({ method: 'POST', url: '/api/auth/logout' });
      expect(res.statusCode).toBe(200);
    }
  });
});
