import { Resend } from "resend";
import { config } from "../config.js";
import { renderContactEmail, type ContactTemplateData } from "../emails/contact.template.js";
import {
  renderPressingAdminEmail,
  renderPressingCustomerEmail,
  type PressingEmailData,
} from "../emails/pressing.template.js";

export type ContactPayload = ContactTemplateData;

let client: Resend | null = null;

function getClient(): Resend {
  if (!config.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  if (!client) {
    client = new Resend(config.RESEND_API_KEY);
  }
  return client;
}

interface SendEmailParams {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  html: string;
}

async function sendEmail(params: SendEmailParams): Promise<void> {
  const result = await getClient().emails.send(params);
  if (result.error) {
    throw new Error(`Resend error: ${result.error.message ?? "unknown"}`);
  }
}

export async function sendContactEmail(payload: ContactPayload): Promise<void> {
  const { subject, html } = renderContactEmail(payload);
  await sendEmail({
    to: config.CONTACT_EMAIL_TO,
    from: config.CONTACT_EMAIL_FROM,
    replyTo: payload.email,
    subject,
    html,
  });
}

export async function sendPressingReservationEmails(payload: PressingEmailData): Promise<void> {
  const adminEmail = renderPressingAdminEmail(payload);
  const customerEmail = renderPressingCustomerEmail(payload);

  const results = await Promise.allSettled([
    sendEmail({
      to: config.CONTACT_EMAIL_TO,
      from: config.CONTACT_EMAIL_FROM,
      replyTo: payload.email,
      ...adminEmail,
    }),
    sendEmail({
      to: payload.email,
      from: config.CONTACT_EMAIL_FROM,
      replyTo: config.CONTACT_EMAIL_TO,
      ...customerEmail,
    }),
  ]);

  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length > 0) {
    throw new AggregateError(
      failures.map((failure) => failure.reason),
      `Failed to send ${failures.length} pressing reservation email(s)`,
    );
  }
}
