import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface JwtPayload {
  userId: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

export function signToken(userId: string): string {
  return jwt.sign({ userId } satisfies JwtPayload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export const COOKIE_NAME = "pompom_token";

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: config.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7j (en secondes pour @fastify/cookie)
};
