import * as React from "react";
import { del, get, head } from "@vercel/blob";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { OfferEmail } from "@/emails/offer-email";
import { hasMeaningfulContent, parseAddresses, sanitizeEmailHtml } from "@/lib/mail-content";
import { isAuthorizedMutation } from "@/lib/request-auth";
import { archiveSentMessage } from "@/lib/sent-mail-store";
import { getSignature } from "@/lib/signature-store";
import { formatSender, getSenders } from "@/lib/sender-store";
import { getTemplates } from "@/lib/template-store";
import { renderMailTemplate } from "@/lib/mail-template";
import { getInbound } from "@/lib/inbound-store";
import { replyHeaders } from "@/lib/inbound-mail";
import { buildReplyHistory, appendReplyHistory } from "@/lib/reply-history";

export const maxDuration = 60;
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
type AttachmentInput = { url?: unknown; pathname?: unknown; filename?: unknown; size?: unknown; contentType?: unknown };

export async function POST(request: Request) {
  if (!(await isAuthorizedMutation(request))) return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Brakuje zmiennej RESEND_API_KEY." }, { status: 503 });

  const temporaryPaths: string[] = [];
  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.replyToKey !== undefined && typeof body.replyToKey !== "string") return NextResponse.json({ error: "Nieprawidłowa wiadomość źródłowa." }, { status: 400 });
    const original = body.replyToKey ? await getInbound(body.replyToKey as string) : null;
    if (body.replyToKey && !original) return NextResponse.json({ error: "Nie znaleziono wiadomości, na którą odpowiadasz." }, { status: 400 });
    const threadHeaders = original ? replyHeaders(original) : undefined;
    const replyHistoryHtml = original ? buildReplyHistory(original) : "";
    const senders = await getSenders();
    const sender = senders.find((item) => item.id === body.senderId) ?? (typeof body.senderId === "undefined" ? senders.find((item) => item.isDefault) : undefined);
    if (!sender) return NextResponse.json({ error: "Wybierz poprawnego nadawcę z zapisanej listy." }, { status: 400 });
    const from = formatSender(sender);
    const to = parseAddresses(body.to);
    const cc = parseAddresses(body.cc);
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const templateLabel = typeof body.templateLabel === "string" ? body.templateLabel.trim() : "Propozycja współpracy";
    const html = sanitizeEmailHtml(body.html);
    if (!to.length) return NextResponse.json({ error: "Podaj co najmniej jeden poprawny adres odbiorcy." }, { status: 400 });
    if (!subject || subject.length > 200) return NextResponse.json({ error: "Temat jest wymagany i może mieć maksymalnie 200 znaków." }, { status: 400 });
    if (!templateLabel || templateLabel.length > 60) return NextResponse.json({ error: "Etykieta jest wymagana i może mieć maksymalnie 60 znaków." }, { status: 400 });
    if (!hasMeaningfulContent(html)) return NextResponse.json({ error: "Treść wiadomości nie może być pusta." }, { status: 400 });

    if (body.templateId !== undefined && typeof body.templateId !== "string") return NextResponse.json({ error: "Nieprawidłowy szablon." }, { status: 400 });
    const selectedTemplate = body.templateId ? (await getTemplates()).find((item) => item.id === body.templateId) : undefined;
    if (body.templateId && !selectedTemplate) return NextResponse.json({ error: "Wybrany szablon już nie istnieje. Odśwież stronę i wybierz inny." }, { status: 400 });

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
    const renderedHtml = selectedTemplate ? appendReplyHistory(renderMailTemplate(selectedTemplate.html, { bodyHtml: html, signatureHtml, subject, templateLabel }), replyHistoryHtml) : undefined;
    const resend = new Resend(apiKey);
    const messages = to.map((recipient) => ({
      from,
      to: [recipient],
      ...(cc.length ? { cc } : {}),
      subject,
      ...(threadHeaders ? { headers: threadHeaders } : {}),
      ...(renderedHtml ? { html: renderedHtml } : { react: React.createElement(OfferEmail, { bodyHtml: html, signatureHtml, subject, templateLabel, replyHistoryHtml }) }),
      ...(attachments.length ? { attachments } : {}),
    }));
    const { data, error } = await resend.batch.send(messages);
    if (error) return NextResponse.json({ error: error.message || "Resend odrzucił wysyłkę." }, { status: 502 });
    const resendIds = data?.data?.map((item) => item.id) ?? [];
    try {
      const archived = await archiveSentMessage({ from, to, cc, subject, templateLabel, bodyHtml: html, signatureHtml, replyHistoryHtml, resendIds, renderedHtml, templateName: selectedTemplate?.name, replyToKey: original?.key, inReplyTo: threadHeaders?.["In-Reply-To"], references: threadHeaders?.References, attachments: archiveAttachments });
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
