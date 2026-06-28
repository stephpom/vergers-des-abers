import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth.js";

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("[seed] ADMIN_EMAIL / ADMIN_PASSWORD non définis — skip création admin.");
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] Admin ${email} existe déjà.`);
    return;
  }
  const hashed = await hashPassword(password);
  await prisma.user.create({ data: { email, password: hashed } });
  console.log(`[seed] Admin créé: ${email}`);
}

async function main() {
  await seedAdmin();
}

main()
  .catch((err) => {
    console.error("[seed] FATAL:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
