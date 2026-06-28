import { afterAll, afterEach, beforeAll, describe, it, expect, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "./helpers.js";

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

afterEach(() => {
  mockSend.mockReset();
});

const validPayload = {
  name: "Jean Dupont",
  email: "jean@example.com",
  phone: "0644086073",
  message: "Bonjour, je voudrais en savoir plus sur vos produits.",
};

describe("POST /api/contact", () => {
  it("accepte un payload valide et envoie un email via Resend (200)", async () => {
    mockSend.mockResolvedValue({ data: { id: "msg_123" }, error: null });

    const res = await app.inject({
      method: "POST",
      url: "/api/contact",
      payload: validPayload,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ ok: boolean }>().ok).toBe(true);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const sendArg = mockSend.mock.calls[0]![0] as {
      to: string;
      from: string;
      replyTo: string;
      subject: string;
      html: string;
    };
    expect(sendArg.to).toBeTruthy();
    expect(sendArg.from).toBeTruthy();
    expect(sendArg.replyTo).toBe(validPayload.email);
    expect(sendArg.subject).toMatch(/contact/i);
    expect(sendArg.html).toContain(validPayload.name);
    expect(sendArg.html).toContain(validPayload.email);
    expect(sendArg.html).toContain(validPayload.phone);
    expect(sendArg.html).toContain(validPayload.message);
  });

  it("échappe le HTML dans les champs utilisateur (anti-injection)", async () => {
    mockSend.mockResolvedValue({ data: { id: "msg_xss" }, error: null });

    const payload = {
      ...validPayload,
      name: "<script>alert(1)</script>",
      message: "<img src=x onerror=alert(1)>Bonjour ceci est mon message.",
    };

    const res = await app.inject({ method: "POST", url: "/api/contact", payload });

    expect(res.statusCode).toBe(200);
    const sendArg = mockSend.mock.calls[0]![0] as { html: string };
    expect(sendArg.html).not.toContain("<script>");
    expect(sendArg.html).not.toContain("onerror");
  });

  it("rejette un email malformé (400)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/contact",
      payload: { ...validPayload, email: "pas-un-email" },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBe("Invalid input");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejette un message trop court (400)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/contact",
      payload: { ...validPayload, message: "court" },
    });

    expect(res.statusCode).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejette un téléphone trop court (400) — si fourni", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/contact",
      payload: { ...validPayload, phone: "123" },
    });

    expect(res.statusCode).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('accepte un payload sans phone (200) et exclut "Téléphone" du HTML', async () => {
    mockSend.mockResolvedValue({ data: { id: "msg_nophone" }, error: null });

    const { phone: _phone, ...payloadNoPhone } = validPayload;
    const res = await app.inject({
      method: "POST",
      url: "/api/contact",
      payload: payloadNoPhone,
    });

    expect(res.statusCode).toBe(200);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const sendArg = mockSend.mock.calls[0]![0] as { html: string };
    expect(sendArg.html).not.toContain("Téléphone");
  });

  it("retourne 500 si Resend lève une exception", async () => {
    mockSend.mockRejectedValue(new Error("Resend API down"));

    const res = await app.inject({
      method: "POST",
      url: "/api/contact",
      payload: validPayload,
    });

    expect(res.statusCode).toBe(500);
    expect(res.json<{ error: string }>().error).toMatch(/envoi/i);
  });

  it("retourne 500 si Resend répond avec un objet error", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "Invalid API key" } });

    const res = await app.inject({
      method: "POST",
      url: "/api/contact",
      payload: validPayload,
    });

    expect(res.statusCode).toBe(500);
  });
});
