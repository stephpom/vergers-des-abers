import sanitizeHtml from "sanitize-html";
import type { PressingRate } from "@prisma/client";

export interface PressingEmailData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  quantityKg: number;
  rate: PressingRate;
  startsAt: Date;
}

const WORKSHOP_ADDRESS = "160 Koad Kenan, 29880 Plouguerneau";

function escape(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(value);
}

function rateLabel(rate: PressingRate): string {
  return rate === "WITH_BOTTLES" ? "Avec bouteille — 1,40 € / L" : "Sans bouteille — 1 € / L";
}

function signature(): string {
  return `
    <p>
      Stéphane Pommier<br>
      Producteur récoltant<br>
      Pom'Pom - Vergers des Abers<br>
      Contact : <a href="mailto:pom-pom@mailo.com">pom-pom@mailo.com</a> /
      <a href="tel:+33644086073">06 44 08 60 73</a>
    </p>
  `.trim();
}

export function renderPressingAdminEmail(data: PressingEmailData): {
  subject: string;
  html: string;
} {
  const fullName = `${escape(data.firstName)} ${escape(data.lastName)}`;
  const subjectName = `${escape(data.firstName)} ${escape(data.lastName)}`.replace(/\s+/g, " ");

  return {
    subject: `[Pressage Pom'Pom] Nouvelle réservation de ${subjectName}`,
    html: `
      <h2>Nouvelle réservation de pressage</h2>
      <p><strong>Client :</strong> ${fullName}</p>
      <p><strong>Email :</strong> ${escape(data.email)}</p>
      <p><strong>Téléphone :</strong> ${escape(data.phone)}</p>
      <p><strong>Créneau :</strong> ${formatDate(data.startsAt)}</p>
      <p><strong>Quantité :</strong> ${data.quantityKg} kg</p>
      <p><strong>Tarif :</strong> ${rateLabel(data.rate)}</p>
    `.trim(),
  };
}

export function renderPressingCustomerEmail(data: PressingEmailData): {
  subject: string;
  html: string;
} {
  return {
    subject: "Confirmation de votre réservation de pressage Pom'Pom",
    html: `
      <p>Bonjour ${escape(data.firstName)},</p>
      <p>Votre réservation de pressage est bien confirmée.</p>
      <h2>Récapitulatif</h2>
      <p><strong>Créneau :</strong> ${formatDate(data.startsAt)}</p>
      <p><strong>Quantité de pommes :</strong> ${data.quantityKg} kg</p>
      <p><strong>Tarif :</strong> ${rateLabel(data.rate)}</p>
      <p><strong>Adresse de l'atelier :</strong><br>${WORKSHOP_ADDRESS}</p>
      <p>
        Merci de venir à deux : deux personnes de votre groupe participeront au tri des pommes
        et à l'embouteillage, accompagnées par l'équipe de l'atelier.
      </p>
      <p>À bientôt,</p>
      ${signature()}
    `.trim(),
  };
}
