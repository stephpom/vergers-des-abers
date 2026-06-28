import sanitizeHtml from "sanitize-html";
import { prisma } from "../lib/prisma.js";
import { slugify } from "../lib/slug.js";

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "blockquote",
    "a",
    "code",
    "pre",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
};

function sanitizeDescription(html: string): string {
  return sanitizeHtml(html, sanitizeOptions);
}

async function uniqueSlug(base: string, ignoreProductId?: string): Promise<string> {
  let slug = slugify(base);
  if (!slug) slug = "produit";
  let candidate = slug;
  let n = 1;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === ignoreProductId) return candidate;
    n += 1;
    candidate = `${slug}-${n}`;
  }
}

export async function listPublishedProducts() {
  return prisma.product.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { position: "asc" } },
    },
  });
}

export async function getPublishedProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, published: true },
    include: {
      images: { orderBy: { position: "asc" } },
    },
  });
}

export async function listAllProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { position: "asc" } },
    },
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
    },
  });
}

export interface CreateProductInput {
  title: string;
  description?: string;
  slug?: string;
  published?: boolean;
}

export async function createProduct(input: CreateProductInput) {
  const slug = await uniqueSlug(input.slug || input.title);
  return prisma.product.create({
    data: {
      title: input.title,
      slug,
      description: sanitizeDescription(input.description ?? ""),
      published: input.published ?? false,
    },
    include: { images: true },
  });
}

export interface UpdateProductInput {
  title?: string;
  description?: string;
  slug?: string;
  published?: boolean;
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = sanitizeDescription(input.description);
  if (input.published !== undefined) data.published = input.published;
  if (input.slug !== undefined) {
    data.slug = await uniqueSlug(input.slug, id);
  }
  return prisma.product.update({
    where: { id },
    data,
    include: { images: { orderBy: { position: "asc" } } },
  });
}

export async function deleteProduct(id: string) {
  return prisma.product.delete({ where: { id } });
}
