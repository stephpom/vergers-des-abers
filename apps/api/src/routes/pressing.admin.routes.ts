import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import * as z from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/authenticate.js";

const slotBody = z.object({
  startsAt: z.coerce.date().refine((date) => date > new Date(), "Date must be in the future"),
});
const settingsBody = z.object({ enabled: z.boolean() });

export async function pressingAdminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/settings", async () => {
    const settings = await prisma.pressingSettings.findUnique({ where: { id: "main" } });
    return { enabled: settings?.enabled ?? false };
  });

  app.patch("/settings", async (req, reply) => {
    const parsed = settingsBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const settings = await prisma.pressingSettings.upsert({
      where: { id: "main" },
      create: { id: "main", enabled: parsed.data.enabled },
      update: { enabled: parsed.data.enabled },
    });
    return { enabled: settings.enabled };
  });

  app.get("/slots", async () => {
    const slots = await prisma.pressingSlot.findMany({
      orderBy: { startsAt: "asc" },
      include: { reservations: { orderBy: { createdAt: "asc" } } },
    });
    return { slots };
  });

  app.post("/slots", async (req, reply) => {
    const parsed = slotBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }

    try {
      const slot = await prisma.pressingSlot.create({
        data: { startsAt: parsed.data.startsAt, capacityKg: 800 },
      });
      return reply.code(201).send({ slot });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return reply.code(409).send({ error: "Slot already exists" });
      }
      throw error;
    }
  });

  app.delete<{ Params: { id: string } }>("/slots/:id", async (req, reply) => {
    try {
      await prisma.pressingSlot.delete({ where: { id: req.params.id } });
      return reply.code(204).send();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2003") {
          return reply.code(409).send({ error: "Slot has reservations" });
        }
        if (error.code === "P2025") {
          return reply.code(404).send({ error: "Not found" });
        }
      }
      throw error;
    }
  });

  app.delete<{ Params: { id: string } }>("/reservations/:id", async (req, reply) => {
    try {
      await prisma.pressingReservation.delete({ where: { id: req.params.id } });
      return reply.code(204).send();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return reply.code(404).send({ error: "Not found" });
      }
      throw error;
    }
  });
}
