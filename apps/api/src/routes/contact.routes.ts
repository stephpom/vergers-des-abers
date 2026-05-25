import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sendContactEmail } from '../services/email.service.js';

const contactBody = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().min(10).max(20),
  message: z.string().min(10).max(1000),
});

export async function contactRoutes(app: FastifyInstance) {
  app.post('/', async (req, reply) => {
    const parsed = contactBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid input', details: parsed.error.flatten() });
    }

    try {
      await sendContactEmail(parsed.data);
      return { ok: true };
    } catch (err) {
      app.log.error({ err }, 'Failed to send contact email');
      return reply.code(500).send({ error: "Échec de l'envoi du message" });
    }
  });
}
