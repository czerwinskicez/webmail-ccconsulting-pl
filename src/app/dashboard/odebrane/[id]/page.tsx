import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchiveButton } from "@/components/archive-button";
import { getArchiveState } from "@/lib/archive-store";
import { isConversationArchived } from "@/lib/archive-state";
import { getConversations } from "@/lib/conversation-store";
import { inboundDocument } from "@/lib/inbound-mail";
import { isAnswered, mailTime } from "@/lib/conversations";
import { OfferEmailContent } from "@/emails/offer-email";

export const metadata = { title: "Rozmowa" };
export default async function ReceivedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ conversations, failed }, archiveState] = await Promise.all([getConversations(), getArchiveState()]);
  const conversation = conversations.find((item) => item.incoming.some((mail) => mail.key === id));
  if (!conversation) { if (failed) throw new Error("Nie udało się odczytać rozmowy."); notFound(); }
  const latest = conversation.latest;
  const archived = isConversationArchived(archiveState, conversation.id, latest.receivedAt);
  const events = [
    ...conversation.incoming.map((mail) => ({ key: mail.key, date: mail.receivedAt, incoming: mail, outgoing: undefined })),
    ...conversation.outgoing.map((mail) => ({ key: mail.id, date: mail.sentAt, incoming: undefined, outgoing: mail })),
  ].sort((a, b) => mailTime(a.date) - mailTime(b.date));
  return <main className="dashboard-content sent-detail-content">
    <Link className="back-link" href="/dashboard/odebrane">← Wróć do rozmów</Link>
    <div className="sent-detail-heading"><div><div className="eyebrow muted">ROZMOWA · {events.length} WIADOMOŚCI</div><h1>{latest.subject.replace(/^(?:\s*re\s*:\s*)+/i, "")}</h1><p className="template-help">{latest.from.name} · {latest.from.address}</p><span className={`thread-status ${conversation.answered ? "answered" : "pending"}`}>{conversation.answered ? "Odpowiedziano" : "Do odpowiedzi"}</span></div><div className="detail-heading-actions">{(latest.replyTo.length > 0 || latest.from.address) && <Link className="primary-small-button" href={`/dashboard/wysylki?reply=${latest.key}`}>Odpowiedz</Link>}<ArchiveButton kind="conversation" id={conversation.id} archived={archived} /></div></div>
    {!!failed && <p className="composer-status error">Historia i statusy mogą być niepełne — nie odczytano części wiadomości.</p>}
    <div className="conversation-timeline">{events.map((event, index) => <details className={`thread-message ${event.outgoing ? "outgoing" : "incoming"}`} key={event.key} open={index === events.length - 1 || event.key === latest.key || (id !== conversation.id && event.key === id)}>
      <summary><span><strong>{event.incoming ? event.incoming.from.name || event.incoming.from.address : "Ja"}</strong><small>{event.incoming ? event.incoming.from.address : event.outgoing!.from}</small></span><span className="thread-event-meta"><span className="thread-status">{event.incoming ? isAnswered(event.incoming, conversation.outgoing) ? "Odpowiedziano" : "Odebrano" : "Wysłano"}</span><time>{mailTime(event.date) ? new Date(event.date).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" }) : "Brak daty"}</time></span></summary>
      {event.incoming ? <>
        <dl className="message-headers"><div><dt>Do</dt><dd>{event.incoming.to.map((item) => item.address).join(", ") || event.incoming.envelopeTo}</dd></div>{event.incoming.cc.length > 0 && <div><dt>DW</dt><dd>{event.incoming.cc.map((item) => item.address).join(", ")}</dd></div>}<div><dt>Temat</dt><dd>{event.incoming.subject}</dd></div></dl>
        {event.incoming.parseFailed && <p className="composer-status error">Treść może być niekompletna. Pełna kopia jest na Gmailu.</p>}
        <iframe className="template-frame inbound-frame" title="Treść odebranej wiadomości" sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" srcDoc={inboundDocument(event.incoming)} />
        {event.incoming.attachments.length > 0 && <div className="thread-attachments"><p>Załączniki są dostępne w kopii wiadomości na Gmailu.</p>{event.incoming.attachments.map((file, i) => <div key={i}>{file.filename} · {Math.ceil(file.size / 1024)} KB</div>)}</div>}
        <div className="thread-actions"><Link href={`/dashboard/wysylki?reply=${event.key}`} className="secondary-button">Odpowiedz na tę wiadomość</Link></div>
      </> : <>
        <dl className="message-headers"><div><dt>Do</dt><dd>{event.outgoing!.to.join(", ")}</dd></div><div><dt>Temat</dt><dd>{event.outgoing!.subject}</dd></div></dl>
        {event.outgoing!.renderedHtml ? <iframe className="template-frame" title="Moja odpowiedź" sandbox="" srcDoc={event.outgoing!.renderedHtml} /> : <div className="sent-email-preview"><OfferEmailContent replyHistoryHtml={event.outgoing!.replyHistoryHtml} bodyHtml={event.outgoing!.bodyHtml} signatureHtml={event.outgoing!.signatureHtml} subject={event.outgoing!.subject} templateLabel={event.outgoing!.templateLabel} /></div>}
        <div className="thread-actions"><Link className="secondary-button" href={`/dashboard/wyslane/${event.key}`}>Otwórz w wysłanych</Link></div>
      </>}
    </details>)}</div>
    <p className="template-help">Zewnętrzne obrazy są zablokowane. Pełną wersję wiadomości znajdziesz na Gmailu.</p>
  </main>;
}
