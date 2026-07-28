import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export async function salesPointsRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    try {
      const salesPoints = await prisma.salesPoint.findMany({
        where: { published: true },
        orderBy: [{ createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          address: true,
          description: true,
          latitude: true,
          longitude: true,
        },
      });

      return { salesPoints };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2021") {
        return { salesPoints: [] };
      }

      throw error;
    }
  });
}
