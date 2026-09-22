import sanitizeHtml from "sanitize-html";
import type { InboundMail } from "./inbound-mail";

const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function sanitizeHistory(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "br"],
    allowedAttributes: { a: ["href"], "*": ["style"] },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowedStyles: { "*": { "white-space": [/^pre-wrap$/], "overflow-wrap": [/^anywhere$/], "border-left": [/^2px solid #cccccc$/], padding: [/^0 0 0 16px$/], margin: [/^16px 0$/], color: [/^#555555$/], "font-size": [/^13px$/], "line-height": [/^1.6$/] } },
  });
}

// Quote the selected original, including the history already contained in it.
// Do not append sibling conversations or messages received after that original.
export function buildReplyHistory(message: InboundMail): string {
  const from = message.from.name ? `${message.from.name} <${message.from.address}>` : message.from.address;
  const date = Number.isFinite(Date.parse(message.receivedAt)) ? new Date(message.receivedAt).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" }) : message.receivedAt;
  const content = message.html ? sanitizeHistory(message.html) : `<div style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(message.text)}</div>`;
  return `<div style="margin:16px 0;color:#555555;font-size:13px;line-height:1.6"><p><strong>Poprzednia wiadomość</strong><br>Od: ${escape(from)}<br>Data: ${escape(date)}<br>Do: ${escape(message.to.map((item) => item.address).join(", ") || message.envelopeTo)}<br>Temat: ${escape(message.subject)}</p><blockquote style="border-left:2px solid #cccccc;padding:0 0 0 16px;margin:16px 0">${content || "Brak treści wiadomości."}</blockquote></div>`;
}

export function appendReplyHistory(document: string, history: string): string {
  if (!history) return document;
  const section = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;color:#555555"><tr><td style="padding:24px;font-family:Arial,Helvetica,sans-serif">${sanitizeHistory(history)}</td></tr></table>`;
  return /<\/body\s*>/i.test(document) ? document.replace(/<\/body\s*>/i, () => `${section}</body>`) : document + section;
}
