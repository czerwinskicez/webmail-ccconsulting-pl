import * as React from "react";
import { del, get, head } from "@vercel/blob";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { OfferEmail } from "@/emails/offer-email";
import { hasMeaningfulContent, parseAddresses, sanitizeEmailHtml } from "@/lib/mail-content";
import { isAuthorizedMutation } from "@/lib/request-auth";
import { archiveSentMessage } from "@/lib/sent-mail-store";
import { getSignature } from "@/lib/signature-store";

export const maxDuration = 60;
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const FROM = "Cezary Czerwiński <biuro@ccconsulting.pl>";

type AttachmentInput = { url?: unknown; pathname?: unknown; filename?: unknown; size?: unknown; contentType?: unknown };

export async function POST(request: Request) {
  if (!(await isAuthorizedMutation(request))) return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Brakuje zmiennej RESEND_API_KEY." }, { status: 503 });

  const temporaryPaths: string[] = [];
  try {
    const body = await request.json() as Record<string, unknown>;
    const to = parseAddresses(body.to);
    const cc = parseAddresses(body.cc);
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const templateLabel = typeof body.templateLabel === "string" ? body.templateLabel.trim() : "Propozycja współpracy";
    const html = sanitizeEmailHtml(body.html);
    if (!to.length) return NextResponse.json({ error: "Podaj co najmniej jeden poprawny adres odbiorcy." }, { status: 400 });
    if (!subject || subject.length > 200) return NextResponse.json({ error: "Temat jest wymagany i może mieć maksymalnie 200 znaków." }, { status: 400 });
    if (!templateLabel || templateLabel.length > 60) return NextResponse.json({ error: "Etykieta jest wymagana i może mieć maksymalnie 60 znaków." }, { status: 400 });
    if (!hasMeaningfulContent(html)) return NextResponse.json({ error: "Treść wiadomości nie może być pusta." }, { status: 400 });

    const inputs = Array.isArray(body.attachments) ? body.attachments as AttachmentInput[] : [];
    if (inputs.length > 10) return NextResponse.json({ error: "Możesz dodać maksymalnie 10 załączników." }, { status: 400 });
    const attachments: { filename: string; content: Buffer; contentType?: string }[] = [];
    const archiveAttachments: { filename: string; temporaryPathname: string; size: number; contentType: string }[] = [];
    let totalSize = 0;

    for (const item of inputs) {
      const pathname = typeof item.pathname === "string" ? item.pathname : "";
      const filename = typeof item.filename === "string" ? item.filename.slice(0, 180) : "załącznik";
      if (!pathname.startsWith("attachments/") || typeof item.url !== "string" || !item.url.includes("/attachments/")) throw new Error("Nieprawidłowy załącznik.");
      const metadata = await head(pathname);
      if (metadata.url !== item.url) throw new Error("Dane załącznika są niespójne.");
      temporaryPaths.push(pathname);
      totalSize += metadata.size;
      if (totalSize > MAX_ATTACHMENT_BYTES) throw new Error("Załączniki przekraczają limit 20 MB.");
      const result = await get(pathname, { access: "private" });
      if (!result || result.statusCode !== 200) throw new Error(`Nie udało się odczytać pliku ${filename}.`);
      const content = Buffer.from(await new Response(result.stream).arrayBuffer());
      attachments.push({ filename, content, contentType: result.blob.contentType });
      archiveAttachments.push({ filename, temporaryPathname: pathname, size: metadata.size, contentType: result.blob.contentType });
    }

    const signatureHtml = await getSignature();
    const resend = new Resend(apiKey);
    const messages = to.map((recipient) => ({
      from: FROM,
      to: [recipient],
      ...(cc.length ? { cc } : {}),
      subject,
      react: React.createElement(OfferEmail, { bodyHtml: html, signatureHtml, subject, templateLabel }),
      ...(attachments.length ? { attachments } : {}),
    }));
    const { data, error } = await resend.batch.send(messages);
    if (error) return NextResponse.json({ error: error.message || "Resend odrzucił wysyłkę." }, { status: 502 });
    const resendIds = data?.data?.map((item) => item.id) ?? [];
    try {
      const archived = await archiveSentMessage({ from: FROM, to, cc, subject, templateLabel, bodyHtml: html, signatureHtml, resendIds, attachments: archiveAttachments });
      return NextResponse.json({ sent: to.length, ids: resendIds, archiveId: archived.id });
    } catch {
      return NextResponse.json({ sent: to.length, ids: resendIds, warning: "Wiadomość została wysłana, ale nie udało się zapisać jej w archiwum." });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nie udało się wysłać wiadomości." }, { status: 500 });
  } finally {
    if (temporaryPaths.length) await del(temporaryPaths).catch(() => undefined);
  }
}
