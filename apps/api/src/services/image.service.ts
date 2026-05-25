import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/prisma.js";
import { config } from "../config.js";

const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export interface UploadFile {
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export class ImageError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ImageError";
  }
}

async function ensureUploadDir(): Promise<string> {
  const dir = path.resolve(config.UPLOAD_DIR);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function addImageToProduct(productId: string, file: UploadFile, alt: string) {
  if (!ALLOWED_MIMES.has(file.mimetype)) {
    throw new ImageError(400, `Unsupported mime type: ${file.mimetype}`);
  }
  const maxBytes = config.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new ImageError(413, `File too large (max ${config.MAX_UPLOAD_SIZE_MB} MB)`);
  }
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: { orderBy: { position: "desc" }, take: 1 } },
  });
  if (!product) throw new ImageError(404, "Product not found");

  const dir = await ensureUploadDir();
  const ext = MIME_TO_EXT[file.mimetype];
  const filename = `${randomBytes(16).toString("hex")}${ext}`;
  await writeFile(path.join(dir, filename), file.buffer);

  const nextPosition = (product.images[0]?.position ?? -1) + 1;

  return prisma.productImage.create({
    data: {
      productId,
      filename,
      alt: alt || product.title,
      position: nextPosition,
    },
  });
}

export async function removeImage(imageId: string) {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) throw new ImageError(404, "Image not found");
  const dir = await ensureUploadDir();
  try {
    await unlink(path.join(dir, image.filename));
  } catch {
    // fichier déjà absent — on continue
  }
  await prisma.productImage.delete({ where: { id: imageId } });
}

/**
 * Réordonne les images d'un produit selon la liste `imageIds` (positions 0..N-1).
 * - Doit contenir EXACTEMENT toutes les images du produit (set égal, pas de sous-ensemble).
 * - Atomique via transaction Prisma.
 */
export async function reorderImages(productId: string, imageIds: string[]) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: { orderBy: { position: "asc" } } },
  });
  if (!product) throw new ImageError(404, "Product not found");

  const currentIds = new Set(product.images.map((i) => i.id));
  if (imageIds.length !== currentIds.size) {
    throw new ImageError(400, "imageIds doit contenir toutes les images du produit");
  }
  for (const id of imageIds) {
    if (!currentIds.has(id)) {
      throw new ImageError(400, `Image ${id} n'appartient pas à ce produit`);
    }
  }

  await prisma.$transaction(
    imageIds.map((id, position) =>
      prisma.productImage.update({ where: { id }, data: { position } }),
    ),
  );

  return prisma.productImage.findMany({
    where: { productId },
    orderBy: { position: "asc" },
  });
}

export async function importImageFromBuffer(
  productId: string,
  buffer: Buffer,
  mimetype: string,
  alt: string,
  position: number,
) {
  if (!ALLOWED_MIMES.has(mimetype)) return null;
  const dir = await ensureUploadDir();
  const ext = MIME_TO_EXT[mimetype];
  const filename = `${randomBytes(16).toString("hex")}${ext}`;
  await writeFile(path.join(dir, filename), buffer);
  return prisma.productImage.create({
    data: { productId, filename, alt, position },
  });
}
