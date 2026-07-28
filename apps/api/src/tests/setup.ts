import { execSync } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";

// Charger .env.test AVANT tout import qui lit process.env (config.ts, prisma.ts…)
dotenv.config({
  path: path.resolve(import.meta.dirname, "../../.env.test"),
  override: true,
});

// Dans Docker, Compose injecte DATABASE_URL (DB dev) avant dotenv ; .env.test pointe
// vers localhost:5433 (hôte). TEST_DATABASE_URL cible db_test sur le réseau compose.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

process.env.NODE_ENV = "test";

// Créer le dossier uploads-test avant que @fastify/static ne le réclame
const apiRoot = path.resolve(import.meta.dirname, "../../");
await mkdir(path.join(apiRoot, "uploads-test"), { recursive: true });

// Importer prisma APRÈS avoir injecté les env vars
const { prisma } = await import("../lib/prisma.js");

// Synchronise le schéma Prisma sur la DB test (pas de migrations dans ce repo)
execSync("bunx prisma db push --accept-data-loss --skip-generate", {
  cwd: apiRoot,
  env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL! },
  stdio: "pipe",
});

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "SalesPoint", "ProductImage", "Product", "User" RESTART IDENTITY CASCADE`,
  );
});

afterAll(async () => {
  await prisma.$disconnect();
  const uploadsDir = path.resolve(import.meta.dirname, "../../uploads-test");
  await rm(uploadsDir, { recursive: true, force: true });
});
