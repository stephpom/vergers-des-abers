import type { FastifyReply, FastifyRequest } from "fastify";
import { COOKIE_NAME, verifyToken } from "../lib/auth.js";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    await reply.code(401).send({ error: "Unauthorized" });
    return reply;
  }
  const payload = verifyToken(token);
  if (!payload) {
    await reply.code(401).send({ error: "Unauthorized" });
    return reply;
  }
  req.userId = payload.userId;
}
