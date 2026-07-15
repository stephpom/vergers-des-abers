import type { FastifyInstance } from "fastify";
import * as z from "zod";
import { authenticate } from "../middleware/authenticate.js";
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
  published: z.boolean().optional(),
});

const updateBody = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(20000).optional(),
  slug: optionalNonEmpty(80),
  published: z.boolean().optional(),
});

const reorderBody = z.object({
  imageIds: z.array(z.string().min(1)).min(1),
});

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

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
