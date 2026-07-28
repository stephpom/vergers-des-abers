import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import * as z from "zod";
import { prisma } from "../lib/prisma.js";
import { sendPressingReservationEmails } from "../services/email.service.js";

const reservationBody = z.object({
  slotId: z.string().min(1),
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((phone) => /^[+\d\s().-]+$/.test(phone) && phone.replace(/\D/g, "").length >= 10),
  quantityKg: z.coerce.number().int().min(300).max(800),
  rate: z.enum(["WITH_BOTTLES", "WITHOUT_BOTTLES"]),
});

export async function pressingRoutes(app: FastifyInstance) {
  app.get("/status", async () => {
    const settings = await prisma.pressingSettings.findUnique({ where: { id: "main" } });
    return { enabled: settings?.enabled ?? false };
  });

  app.get("/slots", async () => {
    const settings = await prisma.pressingSettings.findUnique({ where: { id: "main" } });
    if (!settings?.enabled) {
      return { slots: [] };
    }

    const slots = await prisma.pressingSlot.findMany({
      where: { startsAt: { gt: new Date() } },
      orderBy: { startsAt: "asc" },
      include: {
        reservations: { select: { id: true } },
      },
    });

    return {
      slots: slots
        .map(({ reservations, ...slot }) => ({
          id: slot.id,
          startsAt: slot.startsAt,
          capacityKg: slot.capacityKg,
          isReserved: reservations.length > 0,
        }))
        .filter((slot) => !slot.isReserved)
        .map(({ isReserved: _isReserved, ...slot }) => slot),
    };
  });

  app.post(
    "/reservations",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const parsed = reservationBody.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
      }

      try {
        const settings = await prisma.pressingSettings.findUnique({ where: { id: "main" } });
        if (!settings?.enabled) {
          return reply.code(503).send({ error: "Pressing reservations disabled" });
        }

        const reservation = await prisma.$transaction(
          async (tx) => {
            const slot = await tx.pressingSlot.findUnique({
              where: { id: parsed.data.slotId },
              include: { reservations: { select: { id: true } } },
            });

            if (!slot || slot.startsAt <= new Date() || slot.reservations.length > 0) {
              return null;
            }

            if (parsed.data.quantityKg > slot.capacityKg) {
              return null;
            }

            const reservation = await tx.pressingReservation.create({ data: parsed.data });
            return { reservation, startsAt: slot.startsAt };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        if (!reservation) {
          return reply.code(409).send({ error: "Slot unavailable" });
        }

        try {
          await sendPressingReservationEmails({
            ...reservation.reservation,
            startsAt: reservation.startsAt,
          });
        } catch (error) {
          req.log.error(
            { error, reservationId: reservation.reservation.id },
            "Failed to send pressing reservation emails",
          );
        }

        return reply.code(201).send({ reservation: { id: reservation.reservation.id } });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === "P2002" || error.code === "P2034")
        ) {
          return reply.code(409).send({ error: "Slot unavailable" });
        }
        throw error;
      }
    },
  );
}
