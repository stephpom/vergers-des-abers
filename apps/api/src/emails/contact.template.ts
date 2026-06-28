import sanitizeHtml from "sanitize-html";

export interface ContactTemplateData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

function escape(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
}

export function renderContactEmail(data: ContactTemplateData): {
  subject: string;
  html: string;
} {
  const name = escape(data.name);
  const email = escape(data.email);
  const phoneLine = data.phone ? `<p><strong>Téléphone :</strong> ${escape(data.phone)}</p>` : "";
  const message = escape(data.message).replace(/\n/g, "<br>");

  return {
    subject: `[Contact Pom'Pom] Message de ${data.name}`,
    html: `
    <h2>Nouveau message du formulaire de contact</h2>
    <p><strong>Nom :</strong> ${name}</p>
    <p><strong>Email :</strong> ${email}</p>
    ${phoneLine}
    <p><strong>Message :</strong></p>
    <p>${message}</p>
  `.trim(),
  };
}
