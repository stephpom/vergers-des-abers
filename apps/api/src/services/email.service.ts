import { Resend } from "resend";
import { config } from "../config.js";
import { renderContactEmail, type ContactTemplateData } from "../emails/contact.template.js";

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
