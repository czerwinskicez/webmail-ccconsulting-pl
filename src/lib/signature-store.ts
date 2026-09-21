import "server-only";
import { get, put } from "@vercel/blob";
import { sanitizeEmailHtml } from "@/lib/mail-content";

const SIGNATURE_PATH = "settings/email-signature.html";

export async function getSignature(): Promise<string> {
  try {
    const result = await get(SIGNATURE_PATH, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return "";
    return sanitizeEmailHtml(await new Response(result.stream).text());
  } catch {
    return "";
  }
}

export async function saveSignature(html: string): Promise<string> {
  const sanitized = sanitizeEmailHtml(html);
  await put(SIGNATURE_PATH, sanitized || "<p></p>", {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "text/html; charset=utf-8",
    cacheControlMaxAge: 0,
  });
  return sanitized;
}
