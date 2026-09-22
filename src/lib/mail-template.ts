import sanitizeHtml from "sanitize-html";
import { sanitizeEmailHtml } from "./mail-content";

export type MailTemplate = { id: string; name: string; html: string };
export type TemplateValues = { bodyHtml: string; signatureHtml: string; subject: string; templateLabel: string };

// Variables are only supported in text positions, never inside HTML attributes.
export function sanitizeTemplate(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "html", "head", "body", "title", "meta", "img"],
    allowedAttributes: {
      "*": ["style", "align", "valign", "width", "height", "bgcolor", "role", "lang"],
      table: ["cellpadding", "cellspacing", "border"], td: ["colspan", "rowspan"],
      a: ["href", "target", "rel"], img: ["src", "alt"], meta: ["charset", "name", "content"],
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowProtocolRelative: false,
    allowedStyles: { "*": Object.fromEntries([
      "margin", "margin-top", "margin-bottom", "margin-left", "margin-right", "padding", "padding-top", "padding-bottom", "padding-left", "padding-right",
      "width", "max-width", "min-width", "height", "max-height", "min-height", "background-color", "background", "color", "font", "font-family", "font-size", "font-weight", "font-style",
      "line-height", "letter-spacing", "text-align", "text-decoration", "text-transform", "vertical-align", "border", "border-top", "border-bottom", "border-left", "border-right", "border-collapse", "border-spacing", "border-radius", "display", "overflow", "opacity", "word-break", "overflow-wrap",
    ].map((property) => [property, [/^(?!.*(?:url\s*\(|expression|@|\\)).*$/i]])) },
    transformTags: {
      "*": (tagName, attributes) => ({ tagName, attribs: Object.fromEntries(Object.entries(attributes).filter(([, value]) => !value.includes("{{"))) }),
    },
  });
}

export function validateTemplate(value: unknown): { name: string; html: string } {
  if (!value || typeof value !== "object") throw new Error("Nieprawidłowy szablon.");
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 100) throw new Error("Podaj nazwę szablonu (do 100 znaków).");
  if (typeof input.html !== "string" || input.html.length > 100_000) throw new Error("Kod HTML może mieć maksymalnie 100 000 znaków.");
  if (/\{\{(?!body\}\}|signature\}\}|subject\}\}|label\}\})/.test(input.html)) throw new Error("Dostępne zmienne: {{body}}, {{signature}}, {{subject}}, {{label}}.");
  const html = sanitizeTemplate(input.html).trim();
  if (!html.includes("{{body}}")) throw new Error("Wstaw {{body}} w miejscu treści wiadomości, poza atrybutami HTML.");
  return { name, html };
}

function escapeText(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export function renderMailTemplate(html: string, values: TemplateValues): string {
  const replacements: Record<string, string> = {
    body: sanitizeEmailHtml(values.bodyHtml), signature: sanitizeEmailHtml(values.signatureHtml),
    subject: escapeText(values.subject), label: escapeText(values.templateLabel),
  };
  return sanitizeTemplate(html).replace(/\{\{(body|signature|subject|label)\}\}/g, (_, key: string) => replacements[key]);
}
