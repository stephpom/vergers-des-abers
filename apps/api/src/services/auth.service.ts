import { prisma } from '../lib/prisma.js';
import { verifyPassword } from '../lib/auth.js';

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const ok = await verifyPassword(password, user.password);
  if (!ok) return null;
  return { id: user.id, email: user.email };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  });
  return user;
}
