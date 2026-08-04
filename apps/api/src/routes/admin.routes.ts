import type { FastifyInstance } from "fastify";
import * as z from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { prisma } from "../lib/prisma.js";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listAllProducts,
  updateProduct,
} from "../services/product.service.js";
import {
  addImageToProduct,
  isImageError,
  removeImage,
  reorderImages,
} from "../services/image.service.js";
import { geocodeSalesPoint } from "../services/geocoding.service.js";

/** Transforme les chaînes vides du form en `undefined` avant validation. */
const optionalNonEmpty = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().min(1).max(max).optional(),
  );

const createBody = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(20000).optional(),
  slug: optionalNonEmpty(80),
  category: z.enum(["JUICE", "KEFIR", "JAM_JELLY"]).optional(),
  formats: z
    .array(z.enum(["CL_33", "CL_75", "L_1"]))
    .max(3)
    .optional(),
  published: z.boolean().optional(),
});

const updateBody = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(20000).optional(),
  slug: optionalNonEmpty(80),
  category: z.enum(["JUICE", "KEFIR", "JAM_JELLY"]).optional(),
  formats: z
    .array(z.enum(["CL_33", "CL_75", "L_1"]))
    .max(3)
    .optional(),
  published: z.boolean().optional(),
});

const reorderBody = z.object({
  imageIds: z.array(z.string().min(1)).min(1),
});

const optionalCoordinate = (min: number, max: number) =>
  z.preprocess((value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") return undefined;
      return Number(trimmed);
    }
    return value;
  }, z.number().min(min).max(max).optional());

const coordinatesTogether = <T extends { latitude?: number; longitude?: number }>(values: T) =>
  (values.latitude == null) === (values.longitude == null);

const createSalesPointBody = z
  .object({
    name: z.string().min(1).max(200),
    address: z.string().min(1).max(500),
    description: z.string().max(20000).optional(),
    latitude: optionalCoordinate(-90, 90),
    longitude: optionalCoordinate(-180, 180),
    published: z.boolean().optional(),
  })
  .refine(coordinatesTogether, {
    message: "Latitude and longitude must be provided together",
    path: ["longitude"],
  });

const updateSalesPointBody = z
  .object({
    name: z.string().min(1).max(200).optional(),
    address: z.string().min(1).max(500).optional(),
    description: z.string().max(20000).optional(),
    latitude: optionalCoordinate(-90, 90),
    longitude: optionalCoordinate(-180, 180),
    published: z.boolean().optional(),
  })
  .refine(coordinatesTogether, {
    message: "Latitude and longitude must be provided together",
    path: ["longitude"],
  });

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/sales-points", async () => {
    const salesPoints = await prisma.salesPoint.findMany({
      orderBy: [{ createdAt: "desc" }],
    });
    return { salesPoints };
  });

  app.get<{ Params: { id: string } }>("/sales-points/:id", async (req, reply) => {
    const salesPoint = await prisma.salesPoint.findUnique({ where: { id: req.params.id } });
    if (!salesPoint) return reply.code(404).send({ error: "Not found" });
    return { salesPoint };
  });

  app.post("/sales-points", async (req, reply) => {
    const parsed = createSalesPointBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }

    let coordinates =
      parsed.data.latitude != null && parsed.data.longitude != null
        ? { latitude: parsed.data.latitude, longitude: parsed.data.longitude }
        : null;

    if (!coordinates) {
      try {
        coordinates = await geocodeSalesPoint(parsed.data.name, parsed.data.address);
      } catch (error) {
        req.log.warn({ error }, "Unable to geocode sales point");
      }
    }

    const salesPoint = await prisma.salesPoint.create({
      data: {
        ...parsed.data,
        description: parsed.data.description ?? "",
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
      },
    });

    return reply.code(201).send({ salesPoint });
  });

  app.patch<{ Params: { id: string } }>("/sales-points/:id", async (req, reply) => {
    const parsed = updateSalesPointBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const existing = await prisma.salesPoint.findUnique({ where: { id: req.params.id } });
    if (!existing) return reply.code(404).send({ error: "Not found" });

    const locationChanged =
      (parsed.data.name != null && parsed.data.name !== existing.name) ||
      (parsed.data.address != null && parsed.data.address !== existing.address);
    const hasExplicitCoordinates = parsed.data.latitude != null && parsed.data.longitude != null;
    let coordinates = hasExplicitCoordinates
      ? { latitude: parsed.data.latitude!, longitude: parsed.data.longitude! }
      : null;

    if (!coordinates && locationChanged) {
      try {
        coordinates = await geocodeSalesPoint(
          parsed.data.name ?? existing.name,
          parsed.data.address ?? existing.address,
        );
      } catch (error) {
        req.log.warn({ error }, "Unable to geocode sales point");
      }
    }

    const salesPoint = await prisma.salesPoint.update({
      where: { id: req.params.id },
      data: {
        ...parsed.data,
        description: parsed.data.description ?? existing.description,
        ...(locationChanged
          ? {
              latitude: coordinates?.latitude ?? null,
              longitude: coordinates?.longitude ?? null,
            }
          : {}),
      },
    });

    return { salesPoint };
  });

  app.delete<{ Params: { id: string } }>("/sales-points/:id", async (req, reply) => {
    const existing = await prisma.salesPoint.findUnique({ where: { id: req.params.id } });
    if (!existing) return reply.code(404).send({ error: "Not found" });

    await prisma.salesPoint.delete({ where: { id: req.params.id } });
    return reply.code(204).send();
  });

  app.get("/products", async () => {
    const products = await listAllProducts();
    return { products };
  });

  app.get<{ Params: { id: string } }>("/products/:id", async (req, reply) => {
    const product = await getProductById(req.params.id);
    if (!product) return reply.code(404).send({ error: "Not found" });
    return { product };
  });

  app.post("/products", async (req, reply) => {
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const product = await createProduct(parsed.data);
    return reply.code(201).send({ product });
  });

  app.patch<{ Params: { id: string } }>("/products/:id", async (req, reply) => {
    const parsed = updateBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const existing = await getProductById(req.params.id);
    if (!existing) return reply.code(404).send({ error: "Not found" });
    const product = await updateProduct(req.params.id, parsed.data);
    return { product };
  });

  app.delete<{ Params: { id: string } }>("/products/:id", async (req, reply) => {
    const existing = await getProductById(req.params.id);
    if (!existing) return reply.code(404).send({ error: "Not found" });
    await deleteProduct(req.params.id);
    return reply.code(204).send();
  });

  app.post<{ Params: { id: string } }>("/products/:id/images", async (req, reply) => {
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: "No file uploaded" });
    const buffer = await data.toBuffer();
    const alt = ((data.fields.alt as { value?: string })?.value ?? "") as string;
    try {
      const image = await addImageToProduct(
        req.params.id,
        {
          mimetype: data.mimetype,
          buffer,
          size: buffer.byteLength,
        },
        alt,
      );
      return reply.code(201).send({ image });
    } catch (err) {
      if (isImageError(err)) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.put<{ Params: { id: string } }>("/products/:id/images/order", async (req, reply) => {
    const parsed = reorderBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }
    try {
      const images = await reorderImages(req.params.id, parsed.data.imageIds);
      return { images };
    } catch (err) {
      if (isImageError(err)) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.delete<{ Params: { id: string; imageId: string } }>(
    "/products/:id/images/:imageId",
    async (req, reply) => {
      try {
        await removeImage(req.params.imageId);
        return reply.code(204).send();
      } catch (err) {
        if (isImageError(err)) {
          return reply.code(err.statusCode).send({ error: err.message });
        }
        throw err;
      }
    },
  );
}
