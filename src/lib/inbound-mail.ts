import { parseAddresses } from "./mail-content";
import { sanitizeTemplate } from "./mail-template";

type Address = { address: string; name: string };
export type InboundMail = {
  key: string; subject: string; receivedAt: string; from: Address; to: Address[]; cc: Address[]; replyTo: Address[];
  envelopeTo: string; text: string; html: string; messageId: string; references: string; inReplyTo: string;
  parseFailed: boolean; attachments: { filename: string; size: number; mimeType: string }[];
};
export type ReplyDraft = { key: string; to: string; subject: string; senderId: string; senderMatched: boolean; historyHtml?: string };
const str = (value: unknown) => typeof value === "string" ? value : "";
function addresses(value: unknown): Address[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const address = parseAddresses(item.address, 1)[0];
    return address ? [{ address, name: str(item.name) }] : [];
  });
}
export function parseInbound(value: unknown, key: string): InboundMail {
  if (!value || typeof value !== "object") throw new Error("Nieprawidłowa wiadomość.");
  const v = value as Record<string, unknown>;
  if (v.schemaVersion !== 1 || v.direction !== "inbound") throw new Error("Nieobsługiwany format wiadomości.");
  const envelope = v.envelope as Record<string, unknown> | null;
  return {
    key, subject: str(v.subject) || "Bez tematu", receivedAt: str(v.receivedAt) || str(v.date),
    from: addresses([v.from])[0] ?? { address: parseAddresses(envelope?.from, 1)[0] || "", name: "Nieznany nadawca" },
    to: addresses(v.to), cc: addresses(v.cc), replyTo: addresses(v.replyTo), envelopeTo: parseAddresses(envelope?.to, 1)[0] || "",
    text: str(v.text), html: str(v.html), messageId: str(v.messageId), references: str(v.references), inReplyTo: str(v.inReplyTo),
    parseFailed: (v.parse as { success?: boolean } | null)?.success === false,
    attachments: Array.isArray(v.attachments) ? v.attachments.filter((item) => item && typeof item === "object").map((item) => ({ filename: str(item.filename) || "Załącznik", size: typeof item.size === "number" && item.size >= 0 ? item.size : 0, mimeType: str(item.mimeType) })) : [],
  };
}
export function replyDraft(message: InboundMail, senders: { id: string; email: string; isDefault: boolean }[]): ReplyDraft {
  const matched = senders.find((sender) => sender.email.toLowerCase() === message.envelopeTo.toLowerCase())
    ?? senders.find((sender) => message.to.some((address) => address.address === sender.email.toLowerCase()));
  const sender = matched ?? senders.find((item) => item.isDefault) ?? senders[0];
  return { key: message.key, to: (message.replyTo.length ? message.replyTo : [message.from]).map((item) => item.address).filter(Boolean).join(", "), subject: `Re: ${message.subject.replace(/^(?:\s*re\s*:\s*)+/i, "")}`.slice(0, 200), senderId: sender.id, senderMatched: !!matched };
}
export function replyHeaders(message: InboundMail): Record<string, string> {
  const ids = (value: string) => value.match(/<[^<>\s\x00-\x1f\x7f]+@[^<>\s\x00-\x1f\x7f]+>/g) ?? [];
  const parent = ids(message.messageId)[0];
  if (!parent) return {};
  const references = [...new Set([...ids(message.references || message.inReplyTo), parent])];
  // Keep the root and most recent ancestors within a bounded header size.
  while (references.join(" ").length > 800 && references.length > 2) references.splice(1, 1);
  return { "In-Reply-To": parent, References: references.join(" ") };
}
export function inboundDocument(message: InboundMail): string {
  const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const content = message.html ? sanitizeTemplate(message.html) : `<pre style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(message.text || "Brak treści wiadomości.")}</pre>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; form-action 'none'; base-uri 'none'"><style>body{margin:16px;font:14px/1.6 Arial,sans-serif;color:#222;background:white;overflow-wrap:anywhere}table{max-width:100%}a{color:#555;text-decoration:underline}</style></head><body>${content}</body></html>`;
}
