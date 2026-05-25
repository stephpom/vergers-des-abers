import { Resend } from 'resend';
import sanitizeHtml from 'sanitize-html';
import { config } from '../config.js';

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  message: string;
}

let client: Resend | null = null;

function getClient(): Resend {
  if (!config.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  if (!client) {
    client = new Resend(config.RESEND_API_KEY);
  }
  return client;
}

function escape(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
}

function buildHtml(payload: ContactPayload): string {
  const name = escape(payload.name);
  const email = escape(payload.email);
  const phone = escape(payload.phone);
  const message = escape(payload.message).replace(/\n/g, '<br>');
  return `
    <h2>Nouveau message du formulaire de contact</h2>
    <p><strong>Nom :</strong> ${name}</p>
    <p><strong>Email :</strong> ${email}</p>
    <p><strong>Téléphone :</strong> ${phone}</p>
    <p><strong>Message :</strong></p>
    <p>${message}</p>
  `.trim();
}

export async function sendContactEmail(payload: ContactPayload): Promise<void> {
  const result = await getClient().emails.send({
    to: config.CONTACT_EMAIL_TO,
    from: config.CONTACT_EMAIL_FROM,
    replyTo: payload.email,
    subject: `[Contact Pom'Pom] Message de ${payload.name}`,
    html: buildHtml(payload),
  });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message ?? 'unknown'}`);
  }
}
