import type { Metadata } from "next";
import { Archive, ArrowUpRight, MailCheck, Paperclip } from "lucide-react";
import Link from "next/link";
import { ArchiveButton } from "@/components/archive-button";
import { getArchiveState } from "@/lib/archive-store";
import { getSentMessages, type SentMessageSummary } from "@/lib/sent-mail-store";

export const metadata: Metadata = { title: "Wysłane" };

export default async function SentPage() {
  const [messages, archiveState] = await Promise.all([getSentMessages(), getArchiveState()]);
  const current = messages.filter((message) => !archiveState.sent[message.id]);
  const archived = messages.filter((message) => archiveState.sent[message.id]);
  return <main className="dashboard-content sent-content">
    <div className="dashboard-heading sent-heading"><div><div className="eyebrow muted"><MailCheck size={13} /> MOJA POCZTA · HISTORIA</div><h1>Wysłane</h1><p>Historia wiadomości wysłanych przez Resend.</p></div><span className="sent-count">{messages.length} {messages.length === 1 ? "wysyłka" : "wysyłek"}</span></div>
    <section className="archive-section" aria-labelledby="sent-current-heading">
      <div className="archive-section-heading"><div><h2 id="sent-current-heading">Bieżące wiadomości</h2><p>Wysłane wiadomości dostępne w głównym widoku.</p></div><span>{current.length}</span></div>
      {current.length ? <SentTable messages={current} archived={false} /> : <section className="sent-empty compact"><span><MailCheck size={24} /></span><h2>Brak bieżących wiadomości</h2><p>{messages.length ? "Wszystkie wysyłki znajdują się w archiwum." : "Pierwsza pomyślnie wysłana wiadomość pojawi się w tym miejscu."}</p>{!messages.length && <Link href="/dashboard/wysylki">Utwórz wiadomość <ArrowUpRight size={15} /></Link>}</section>}
    </section>
    <section className="archive-section" aria-labelledby="sent-archive-heading">
      <div className="archive-section-heading"><div><h2 id="sent-archive-heading"><Archive size={17} /> Archiwum</h2><p>Wiadomości odłożone poza główną listę.</p></div><span>{archived.length}</span></div>
      {archived.length ? <SentTable messages={archived} archived /> : <div className="archive-empty">Nie masz zarchiwizowanych wysyłek.</div>}
    </section>
  </main>;
}

function SentTable({ messages, archived }: { messages: SentMessageSummary[]; archived: boolean }) {
  return <div className="sent-list" aria-label={archived ? "Zarchiwizowane wiadomości" : "Bieżące wysłane wiadomości"}>
    <div className="sent-list-head"><span>Wiadomość</span><span>Odbiorcy</span><span>Data wysłania</span><span>Akcje</span></div>
    {messages.map((message) => <div className="sent-row" key={message.id}>
      <Link className="sent-subject" href={`/dashboard/wyslane/${message.id}`}><span className="sent-mail-icon"><MailCheck size={17} /></span><span><strong>{message.subject}</strong><small>{message.from}</small></span></Link>
      <span className="sent-recipients"><strong>{message.to.join(", ")}</strong><small>{message.cc.length ? `DW: ${message.cc.join(", ")}` : "Bez DW"}{message.attachmentCount ? <><i>·</i><Paperclip size={11} /> {message.attachmentCount}</> : null}</small></span>
      <time dateTime={message.sentAt}>{formatSentDate(message.sentAt)}</time>
      <span className="sent-row-actions"><Link className="sent-open" href={`/dashboard/wyslane/${message.id}`}>Podgląd <ArrowUpRight size={14} /></Link><ArchiveButton kind="sent" id={message.id} archived={archived} /></span>
    </div>)}
  </div>;
}

function formatSentDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Warsaw" }).format(new Date(value));
}
