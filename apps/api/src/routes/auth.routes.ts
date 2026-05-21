import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser, getUserById } from '../services/auth.service.js';
import { COOKIE_NAME, cookieOptions, signToken } from '../lib/auth.js';
import { authenticate } from '../middleware/authenticate.js';

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (req, reply) => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid input', details: parsed.error.flatten() });
    }
    const user = await authenticateUser(parsed.data.email, parsed.data.password);
    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    const token = signToken(user.id);
    reply.setCookie(COOKIE_NAME, token, cookieOptions);
    return { user };
  });

  app.post('/logout', async (_req, reply) => {
    reply.clearCookie(COOKIE_NAME, { path: '/' });
    return { ok: true };
  });

  app.get('/me', { preHandler: [authenticate] }, async (req) => {
    const user = await getUserById(req.userId!);
    return { user };
  });
}
