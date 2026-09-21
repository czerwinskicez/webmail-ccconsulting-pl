import type { Metadata } from "next";
import { ArrowLeft, Download, MailCheck, Paperclip } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OfferEmailContent } from "@/emails/offer-email";
import { getSentMessage } from "@/lib/sent-mail-store";

type SentMessagePageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Podgląd wysłanej wiadomości" };

export default async function SentMessagePage({ params }: SentMessagePageProps) {
  const { id } = await params;
  const message = await getSentMessage(id);
  if (!message) notFound();

  return <main className="dashboard-content sent-detail-content">
    <Link className="back-link" href="/dashboard/wyslane"><ArrowLeft size={15} /> Wróć do wysłanych</Link>
    <div className="sent-detail-heading"><div><div className="eyebrow muted"><MailCheck size={13} /> WYSŁANA WIADOMOŚĆ</div><h1>{message.subject}</h1></div><time dateTime={message.sentAt}>{formatSentDate(message.sentAt)}</time></div>
    <div className="sent-detail-grid">
      <article className="sent-message-card">
        <dl className="message-headers">
          <div><dt>Od</dt><dd>{message.from}</dd></div>
          <div><dt>Do</dt><dd>{message.to.join(", ")}</dd></div>
          {message.cc.length > 0 && <div><dt>DW</dt><dd>{message.cc.join(", ")}</dd></div>}
          <div><dt>Temat</dt><dd>{message.subject}</dd></div>
        </dl>
        <div className="sent-email-preview"><OfferEmailContent bodyHtml={message.bodyHtml} signatureHtml={message.signatureHtml} subject={message.subject} templateLabel={message.templateLabel ?? "Propozycja współpracy"} /></div>
      </article>
      <aside className="sent-detail-sidebar">
        <section><span className="side-label">STATUS</span><div className="delivered-status"><span className="status-dot" /> Wysłano przez Resend</div><small>{message.resendIds.length} {message.resendIds.length === 1 ? "identyfikator dostarczenia" : "identyfikatory dostarczenia"}</small></section>
        <section><div className="side-card-title"><div><Paperclip size={15} /><span>Załączniki</span></div><small>{message.attachments.length}</small></div>{message.attachments.length ? <div className="sent-attachments">{message.attachments.map((attachment) => <a key={attachment.pathname} href={`/api/sent/${message.id}/attachment?pathname=${encodeURIComponent(attachment.pathname)}`}><span className="file-icon"><Paperclip size={14} /></span><span><strong>{attachment.filename}</strong><small>{formatBytes(attachment.size)}</small></span><Download size={14} /></a>)}</div> : <p>Ta wiadomość nie zawiera załączników.</p>}</section>
      </aside>
    </div>
  </main>;
}

function formatSentDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Warsaw" }).format(new Date(value));
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
