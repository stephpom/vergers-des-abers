import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { authedInject, buildTestApp, createTestUser, loginCookie } from "./helpers.js";

const { mockSendPressingEmails } = vi.hoisted(() => ({
  mockSendPressingEmails: vi.fn(),
}));

vi.mock("../services/email.service.js", () => ({
  sendPressingReservationEmails: mockSendPressingEmails,
}));

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  mockSendPressingEmails.mockReset();
  mockSendPressingEmails.mockResolvedValue(undefined);
});

describe("réservations publiques de pressage", () => {
  it("désactive les réservations par défaut", async () => {
    const statusResponse = await app.inject({
      method: "GET",
      url: "/api/pressing/status",
    });
    const reservationResponse = await app.inject({
      method: "POST",
      url: "/api/pressing/reservations",
      payload: {
        slotId: "slot-inexistant",
        firstName: "Marie",
        lastName: "Ker",
        email: "marie@example.com",
        phone: "0612345678",
        quantityKg: 300,
        rate: "WITHOUT_BOTTLES",
      },
    });

    expect(statusResponse.json()).toEqual({ enabled: false });
    expect(reservationResponse.statusCode).toBe(503);
  });

  it("ne republie pas un créneau dès qu'il possède une réservation", async () => {
    await prisma.pressingSettings.create({ data: { id: "main", enabled: true } });
    const slot = await prisma.pressingSlot.create({
      data: { startsAt: new Date(Date.now() + 86_400_000) },
    });
    await prisma.pressingReservation.create({
      data: {
        slotId: slot.id,
        firstName: "Jean",
        lastName: "Pomme",
        email: "jean@example.com",
        phone: "0612345678",
        quantityKg: 320,
        rate: "WITH_BOTTLES",
      },
    });

    const response = await app.inject({ method: "GET", url: "/api/pressing/slots" });

    expect(response.statusCode).toBe(200);
    expect(response.json<{ slots: unknown[] }>().slots).toEqual([]);
  });

  it("impose 300 kg minimum et une seule réservation par créneau", async () => {
    await prisma.pressingSettings.create({ data: { id: "main", enabled: true } });
    const slot = await prisma.pressingSlot.create({
      data: { startsAt: new Date(Date.now() + 86_400_000) },
    });

    const firstResponse = await app.inject({
      method: "POST",
      url: "/api/pressing/reservations",
      payload: {
        slotId: slot.id,
        firstName: "Marie",
        lastName: "Ker",
        email: "marie@example.com",
        phone: "0612345678",
        quantityKg: 500,
        rate: "WITHOUT_BOTTLES",
      },
    });
    const overCapacityResponse = await app.inject({
      method: "POST",
      url: "/api/pressing/reservations",
      payload: {
        slotId: slot.id,
        firstName: "Paul",
        lastName: "Abers",
        email: "paul@example.com",
        phone: "0698765432",
        quantityKg: 300,
        rate: "WITH_BOTTLES",
      },
    });

    expect(firstResponse.statusCode).toBe(201);
    expect(overCapacityResponse.statusCode).toBe(409);
    expect(mockSendPressingEmails).toHaveBeenCalledOnce();
    expect(mockSendPressingEmails).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "marie@example.com",
        quantityKg: 500,
        startsAt: expect.any(Date),
      }),
    );

    const underMinimumResponse = await app.inject({
      method: "POST",
      url: "/api/pressing/reservations",
      payload: {
        slotId: slot.id,
        firstName: "Anne",
        lastName: "Abers",
        email: "anne@example.com",
        phone: "0611223344",
        quantityKg: 299,
        rate: "WITH_BOTTLES",
      },
    });
    expect(underMinimumResponse.statusCode).toBe(400);
  });
});

describe("administration des créneaux de pressage", () => {
  it("protège l'administration et permet de créer un créneau", async () => {
    const unauthorized = await app.inject({
      method: "POST",
      url: "/api/admin/pressing/slots",
      payload: { startsAt: new Date(Date.now() + 172_800_000).toISOString() },
    });

    await createTestUser("pressing-admin@test.local", "admin-password-ok");
    const cookie = await loginCookie(app, "pressing-admin@test.local", "admin-password-ok");
    const authorized = await authedInject(
      app,
      {
        method: "POST",
        url: "/api/admin/pressing/slots",
        payload: { startsAt: new Date(Date.now() + 172_800_000).toISOString() },
      },
      cookie,
    );

    expect(unauthorized.statusCode).toBe(401);
    expect(authorized.statusCode).toBe(201);

    const settingsResponse = await authedInject(
      app,
      {
        method: "PATCH",
        url: "/api/admin/pressing/settings",
        payload: { enabled: true },
      },
      cookie,
    );
    expect(settingsResponse.statusCode).toBe(200);
    expect(settingsResponse.json()).toEqual({ enabled: true });
  });
});
