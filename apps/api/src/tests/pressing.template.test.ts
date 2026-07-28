import { describe, expect, it } from "vitest";
import {
  renderPressingAdminEmail,
  renderPressingCustomerEmail,
} from "../emails/pressing.template.js";

const data = {
  firstName: "Marie",
  lastName: "Ker",
  email: "marie@example.com",
  phone: "06 12 34 56 78",
  quantityKg: 500,
  rate: "WITH_BOTTLES" as const,
  startsAt: new Date("2026-09-15T08:00:00.000Z"),
};

describe("emails de réservation de pressage", () => {
  it("notifie l'atelier avec les coordonnées et le détail de la réservation", () => {
    const email = renderPressingAdminEmail(data);

    expect(email.subject).toContain("Marie Ker");
    expect(email.html).toContain("marie@example.com");
    expect(email.html).toContain("06 12 34 56 78");
    expect(email.html).toContain("500 kg");
    expect(email.html).toContain("1,40 € / L");
  });

  it("confirme au client l'adresse, la participation et la signature", () => {
    const email = renderPressingCustomerEmail(data);

    expect(email.html).toContain("160 Koad Kenan, 29880 Plouguerneau");
    expect(email.html).toContain("venir à deux");
    expect(email.html).toContain("Stéphane Pommier");
    expect(email.html).toContain("Producteur récoltant");
    expect(email.html).toContain("pom-pom@mailo.com");
    expect(email.html).toContain("06 44 08 60 73");
  });

  it("échappe les données saisies par le client", () => {
    const email = renderPressingAdminEmail({
      ...data,
      firstName: "<script>alert(1)</script>",
      lastName: "<img src=x onerror=alert(1)>",
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("onerror");
  });
});
