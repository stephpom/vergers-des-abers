import { afterAll, beforeAll, beforeEach, describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import FormData from 'form-data';
import { buildTestApp, createTestProduct, createTestUser, loginCookie, authedInject } from './helpers.js';
import { prisma } from '../lib/prisma.js';

let app: FastifyInstance;
let cookie: string;

// JPEG minimal valide (10×10 px)
const MINIMAL_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAKAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEA//EACMQAAICAQQCAwAAAAAAAAAAAAECAwQREiExBRNBUf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCj2zT73TL2nb3oXW9RRFm9QpJ2AAAAAASUVORK5CYII=';

function makeJpegBuffer(): Buffer {
  return Buffer.from(MINIMAL_JPEG_BASE64, 'base64');
}

function buildMultipart(
  fileBuffer: Buffer,
  mimetype: string,
  alt = '',
): { body: Buffer; contentType: string } {
  const form = new FormData();
  form.append('file', fileBuffer, { filename: 'image.jpg', contentType: mimetype });
  if (alt) form.append('alt', alt);
  return { body: form.getBuffer(), contentType: form.getHeaders()['content-type'] as string };
}

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

// Le beforeEach global (setup.ts) truncate les tables → recréer l'admin avant chaque test.
beforeEach(async () => {
  await createTestUser('admin-img@test.local', 'admin-password-ok');
  cookie = await loginCookie(app, 'admin-img@test.local', 'admin-password-ok');
});

describe('POST /api/admin/products/:id/images', () => {
  it("retourne 401 sans cookie", async () => {
    const product = await createTestProduct({ title: 'Sans auth' });
    const { body, contentType } = buildMultipart(makeJpegBuffer(), 'image/jpeg');
    const res = await app.inject({
      method: 'POST',
      url: `/api/admin/products/${product.id}/images`,
      headers: { 'content-type': contentType },
      payload: body,
    });
    expect(res.statusCode).toBe(401);
  });

  it("retourne 404 pour un produit inexistant", async () => {
    const { body, contentType } = buildMultipart(makeJpegBuffer(), 'image/jpeg');
    const res = await authedInject(
      app,
      {
        method: 'POST',
        url: '/api/admin/products/id-inexistant/images',
        headers: { 'content-type': contentType },
        payload: body,
      },
      cookie,
    );
    expect(res.statusCode).toBe(404);
  });

  it("uploade un JPEG valide et retourne 201 + position 0", async () => {
    const product = await createTestProduct({ title: 'Avec image' });
    const { body, contentType } = buildMultipart(makeJpegBuffer(), 'image/jpeg', 'Mon alt');
    const res = await authedInject(
      app,
      {
        method: 'POST',
        url: `/api/admin/products/${product.id}/images`,
        headers: { 'content-type': contentType },
        payload: body,
      },
      cookie,
    );
    expect(res.statusCode).toBe(201);
    const { image } = res.json<{
      image: { id: string; filename: string; alt: string; position: number };
    }>();
    expect(image.id).toBeTruthy();
    expect(image.filename).toMatch(/\.jpg$/);
    expect(image.position).toBe(0);

    const filePath = path.resolve(process.env['UPLOAD_DIR'] ?? './uploads-test', image.filename);
    expect(existsSync(filePath)).toBe(true);
  });

  it("incrémente la position pour la 2e image", async () => {
    const product = await createTestProduct({ title: 'Deux images' });

    const { body: b1, contentType: ct1 } = buildMultipart(makeJpegBuffer(), 'image/jpeg');
    await authedInject(
      app,
      {
        method: 'POST',
        url: `/api/admin/products/${product.id}/images`,
        headers: { 'content-type': ct1 },
        payload: b1,
      },
      cookie,
    );

    const { body: b2, contentType: ct2 } = buildMultipart(makeJpegBuffer(), 'image/jpeg');
    const res2 = await authedInject(
      app,
      {
        method: 'POST',
        url: `/api/admin/products/${product.id}/images`,
        headers: { 'content-type': ct2 },
        payload: b2,
      },
      cookie,
    );
    expect(res2.statusCode).toBe(201);
    const { image } = res2.json<{ image: { position: number } }>();
    expect(image.position).toBe(1);
  });

  it("rejette un mimetype non autorisé (400)", async () => {
    const product = await createTestProduct({ title: 'Mauvais type' });
    const { body, contentType } = buildMultipart(Buffer.from('%PDF-1.4'), 'application/pdf');
    const res = await authedInject(
      app,
      {
        method: 'POST',
        url: `/api/admin/products/${product.id}/images`,
        headers: { 'content-type': contentType },
        payload: body,
      },
      cookie,
    );
    expect(res.statusCode).toBe(400);
  });

  it("rejette un fichier trop gros (413)", async () => {
    const product = await createTestProduct({ title: 'Trop gros' });
    // 6 Mo > MAX_UPLOAD_SIZE_MB=5
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024, 0xff);
    const { body, contentType } = buildMultipart(bigBuffer, 'image/jpeg');
    const res = await authedInject(
      app,
      {
        method: 'POST',
        url: `/api/admin/products/${product.id}/images`,
        headers: { 'content-type': contentType },
        payload: body,
      },
      cookie,
    );
    // @fastify/multipart pose 413 sur dépassement de fileSize, le service aussi
    expect([413, 400]).toContain(res.statusCode);
  });
});

describe('DELETE /api/admin/products/:id/images/:imageId', () => {
  it("retourne 401 sans cookie", async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/admin/products/prod-id/images/img-id',
    });
    expect(res.statusCode).toBe(401);
  });

  it("retourne 404 pour un imageId inexistant", async () => {
    const product = await createTestProduct({ title: 'Prod suppr image' });
    const res = await authedInject(
      app,
      {
        method: 'DELETE',
        url: `/api/admin/products/${product.id}/images/image-inexistante`,
      },
      cookie,
    );
    expect(res.statusCode).toBe(404);
  });

  it("supprime l'image (204) et efface le fichier physique", async () => {
    const product = await createTestProduct({ title: 'Prod avec image à suppr' });

    const { body, contentType } = buildMultipart(makeJpegBuffer(), 'image/jpeg');
    const uploadRes = await authedInject(
      app,
      {
        method: 'POST',
        url: `/api/admin/products/${product.id}/images`,
        headers: { 'content-type': contentType },
        payload: body,
      },
      cookie,
    );
    const { image } = uploadRes.json<{ image: { id: string; filename: string } }>();
    const filePath = path.resolve(process.env['UPLOAD_DIR'] ?? './uploads-test', image.filename);
    expect(existsSync(filePath)).toBe(true);

    const res = await authedInject(
      app,
      {
        method: 'DELETE',
        url: `/api/admin/products/${product.id}/images/${image.id}`,
      },
      cookie,
    );
    expect(res.statusCode).toBe(204);

    expect(existsSync(filePath)).toBe(false);

    const inDb = await prisma.productImage.findUnique({ where: { id: image.id } });
    expect(inDb).toBeNull();
  });
});

describe('PUT /api/admin/products/:id/images/order', () => {
  async function uploadThree(productId: string): Promise<string[]> {
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const { body, contentType } = buildMultipart(makeJpegBuffer(), 'image/jpeg');
      const res = await authedInject(
        app,
        {
          method: 'POST',
          url: `/api/admin/products/${productId}/images`,
          headers: { 'content-type': contentType },
          payload: body,
        },
        cookie,
      );
      ids.push(res.json<{ image: { id: string } }>().image.id);
    }
    return ids;
  }

  it("retourne 401 sans cookie", async () => {
    const product = await createTestProduct({ title: 'Reorder no auth' });
    const res = await app.inject({
      method: 'PUT',
      url: `/api/admin/products/${product.id}/images/order`,
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ imageIds: ['x'] }),
    });
    expect(res.statusCode).toBe(401);
  });

  it("retourne 404 pour un produit inexistant", async () => {
    const res = await authedInject(
      app,
      {
        method: 'PUT',
        url: `/api/admin/products/id-inexistant/images/order`,
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ imageIds: ['x'] }),
      },
      cookie,
    );
    expect(res.statusCode).toBe(404);
  });

  it("rejette un body vide (400)", async () => {
    const product = await createTestProduct({ title: 'Reorder body vide' });
    const res = await authedInject(
      app,
      {
        method: 'PUT',
        url: `/api/admin/products/${product.id}/images/order`,
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ imageIds: [] }),
      },
      cookie,
    );
    expect(res.statusCode).toBe(400);
  });

  it("rejette si imageIds incomplet (400)", async () => {
    const product = await createTestProduct({ title: 'Reorder incomplet' });
    const [id1, id2] = await uploadThree(product.id);
    const res = await authedInject(
      app,
      {
        method: 'PUT',
        url: `/api/admin/products/${product.id}/images/order`,
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ imageIds: [id1, id2] }), // manque id3
      },
      cookie,
    );
    expect(res.statusCode).toBe(400);
  });

  it("rejette si une imageId n'appartient pas au produit (400)", async () => {
    const productA = await createTestProduct({ title: 'Reorder A' });
    const productB = await createTestProduct({ title: 'Reorder B' });
    const [, , idAfromA] = await uploadThree(productA.id);
    const idsB = await uploadThree(productB.id);
    const mixed = [...idsB.slice(0, 2), idAfromA]; // imageId de A injectée dans B
    const res = await authedInject(
      app,
      {
        method: 'PUT',
        url: `/api/admin/products/${productB.id}/images/order`,
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ imageIds: mixed }),
      },
      cookie,
    );
    expect(res.statusCode).toBe(400);
  });

  it("réordonne les images selon l'ordre fourni", async () => {
    const product = await createTestProduct({ title: 'Reorder OK' });
    const [id1, id2, id3] = await uploadThree(product.id);
    // initial: [id1=0, id2=1, id3=2] → nouveau: [id3, id1, id2]
    const res = await authedInject(
      app,
      {
        method: 'PUT',
        url: `/api/admin/products/${product.id}/images/order`,
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ imageIds: [id3, id1, id2] }),
      },
      cookie,
    );
    expect(res.statusCode).toBe(200);
    const { images } = res.json<{ images: { id: string; position: number }[] }>();
    expect(images.map((i) => i.id)).toEqual([id3, id1, id2]);
    expect(images.map((i) => i.position)).toEqual([0, 1, 2]);
  });

  it("permet de définir une autre image comme principale (position 0)", async () => {
    const product = await createTestProduct({ title: 'Set as main' });
    const [id1, id2, id3] = await uploadThree(product.id);
    // promo id3 en principale : [id3, id1, id2]
    const res = await authedInject(
      app,
      {
        method: 'PUT',
        url: `/api/admin/products/${product.id}/images/order`,
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ imageIds: [id3, id1, id2] }),
      },
      cookie,
    );
    expect(res.statusCode).toBe(200);
    const fresh = await prisma.productImage.findMany({
      where: { productId: product.id },
      orderBy: { position: 'asc' },
    });
    expect(fresh[0].id).toBe(id3);
  });
});
