import { afterAll, beforeAll, describe, it, expect } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp, createTestUser, loginCookie, authedInject } from "./helpers.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

describe("POST /api/auth/login", () => {
  it("rejette un body invalide (400)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "pas-un-email", password: "" },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: string }>();
    expect(body.error).toBe("Invalid input");
  });

  it("rejette un email inexistant (401)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "nobody@test.local", password: "whatever" },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json<{ error: string }>().error).toBe("Invalid credentials");
  });

  it("rejette un mauvais mot de passe (401)", async () => {
    await createTestUser("user@test.local", "correct-password");
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "user@test.local", password: "wrong-password" },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json<{ error: string }>().error).toBe("Invalid credentials");
  });

  it("accepte des credentials valides et pose le cookie httpOnly (200)", async () => {
    await createTestUser("valid@test.local", "good-password");
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "valid@test.local", password: "good-password" },
    });
    expect(res.statusCode).toBe(200);

    const body = res.json<{ user: { id: string; email: string } }>();
    expect(body.user.email).toBe("valid@test.local");
    expect(body.user.id).toBeTruthy();

    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toBeTruthy();
    const cookieStr = Array.isArray(setCookie) ? setCookie[0] : (setCookie as string);
    expect(cookieStr).toContain("pompom_token=");
    expect(cookieStr.toLowerCase()).toContain("httponly");
  });
});

describe("POST /api/auth/logout", () => {
  it("répond 200 sans cookie (idempotent)", async () => {
    const res = await app.inject({ method: "POST", url: "/api/auth/logout" });
    expect(res.statusCode).toBe(200);
  });

  it("efface le cookie avec une expiry passée ou Max-Age=0", async () => {
    await createTestUser("logout@test.local", "password");
    const cookie = await loginCookie(app, "logout@test.local", "password");

    const res = await authedInject(app, { method: "POST", url: "/api/auth/logout" }, cookie);
    expect(res.statusCode).toBe(200);

    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toBeTruthy();
    const cookieStr = Array.isArray(setCookie) ? setCookie[0] : (setCookie as string);
    // @fastify/cookie clearCookie pose Max-Age=0 ou Expires dans le passé
    const hasMaxAge0 = cookieStr.includes("Max-Age=0");
    const hasExpires = cookieStr.toLowerCase().includes("expires=");
    expect(hasMaxAge0 || hasExpires).toBe(true);
  });
});

describe("GET /api/auth/me", () => {
  it("retourne 401 sans cookie", async () => {
    const res = await app.inject({ method: "GET", url: "/api/auth/me" });
    expect(res.statusCode).toBe(401);
  });

  it("retourne les infos utilisateur avec un cookie valide", async () => {
    await createTestUser("me@test.local", "password");
    const cookie = await loginCookie(app, "me@test.local", "password");

    const res = await authedInject(app, { method: "GET", url: "/api/auth/me" }, cookie);
    expect(res.statusCode).toBe(200);

    const body = res.json<{ user: { id: string; email: string } }>();
    expect(body.user.email).toBe("me@test.local");
  });

  it("retourne 401 avec un token JWT invalide", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie: "pompom_token=ce-token-est-faux" },
    });
    expect(res.statusCode).toBe(401);
  });
});
