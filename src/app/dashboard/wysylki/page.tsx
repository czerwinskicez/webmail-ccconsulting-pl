import type { Metadata } from "next";
import { MailComposer } from "@/components/mail-composer";
import { getSignature } from "@/lib/signature-store";
import { getSenders } from "@/lib/sender-store";
import { getTemplates } from "@/lib/template-store";
import type { MailTemplate } from "@/lib/mail-template";
import { getInbound } from "@/lib/inbound-store";
import { replyDraft } from "@/lib/inbound-mail";
import { notFound } from "next/navigation";
import { buildReplyHistory } from "@/lib/reply-history";

export const metadata: Metadata = { title: "Wysyłki" };

export default async function MailingsPage({ searchParams }: { searchParams: Promise<{ reply?: string }> }) {
  const [signature, senders] = await Promise.all([getSignature(), getSenders()]);
  const { reply } = await searchParams;
  const original = reply ? await getInbound(reply) : null;
  if (reply && !original) notFound();
  const draft = original ? { ...replyDraft(original, senders), historyHtml: buildReplyHistory(original) } : undefined;
  let templates: MailTemplate[] = [];
  let templateError: string | undefined;
  try { templates = await getTemplates(); }
  catch { templateError = "Nie udało się wczytać szablonów. Możesz użyć wbudowanego wyglądu lub odświeżyć stronę."; }
  return <main className="dashboard-content mailings-content">
    <MailComposer key={reply || "new"} initialSignature={signature} senders={senders} templates={templates} templateError={templateError} reply={draft} />
  </main>;
}
