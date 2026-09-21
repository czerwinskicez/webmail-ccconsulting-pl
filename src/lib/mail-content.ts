import sanitizeHtml from "sanitize-html";

const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export function parseAddresses(value: unknown, max = 20): string[] {
  if (typeof value !== "string") return [];
  const unique = [...new Set(value.split(/[;,\n]+/).map((item) => item.trim().toLowerCase()).filter(Boolean))];
  if (unique.length > max || unique.some((address) => !emailPattern.test(address) || address.length > 254)) return [];
  return unique;
}

export function sanitizeEmailHtml(value: unknown): string {
  if (typeof value !== "string" || value.length > 100_000) return "";
  return sanitizeHtml(value, {
    allowedTags: ["p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "a", "h2", "h3", "blockquote"],
    allowedAttributes: { a: ["href", "target", "rel", "style"], "*": ["style"] },
    allowedSchemes: ["http", "https", "mailto"],
    allowedStyles: {
      "*": { "text-align": [/^(left|center|right)$/] },
      a: {
        color: [/^#777772$/],
        "text-decoration": [/^underline$/],
      },
    },
    transformTags: {
      a: (_tagName, attribs) => ({ tagName: "a", attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer", style: "color:#777772;text-decoration:underline" } }),
    },
  }).trim();
}

export function hasMeaningfulContent(html: string): boolean {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/&nbsp;/g, " ").trim().length > 0;
}
