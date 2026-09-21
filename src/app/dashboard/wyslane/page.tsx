import type { Metadata } from "next";
import { ArrowUpRight, MailCheck, Paperclip } from "lucide-react";
import Link from "next/link";
import { getSentMessages } from "@/lib/sent-mail-store";

export const metadata: Metadata = { title: "Wysłane" };

export default async function SentPage() {
  const messages = await getSentMessages();
  return <main className="dashboard-content sent-content">
    <div className="dashboard-heading sent-heading"><div><div className="eyebrow muted"><MailCheck size={13} /> ARCHIWUM</div><h1>Wysłane</h1><p>Historia wiadomości wysłanych przez Resend.</p></div><span className="sent-count">{messages.length} {messages.length === 1 ? "wysyłka" : "wysyłek"}</span></div>
    {messages.length ? <section className="sent-list" aria-label="Wysłane wiadomości">
      <div className="sent-list-head"><span>Wiadomość</span><span>Odbiorcy</span><span>Data wysłania</span><span /></div>
      {messages.map((message) => <Link className="sent-row" href={`/dashboard/wyslane/${message.id}`} key={message.id}>
        <span className="sent-subject"><span className="sent-mail-icon"><MailCheck size={17} /></span><span><strong>{message.subject}</strong><small>{message.from}</small></span></span>
        <span className="sent-recipients"><strong>{message.to.join(", ")}</strong><small>{message.cc.length ? `DW: ${message.cc.join(", ")}` : "Bez DW"}{message.attachmentCount ? <><i>·</i><Paperclip size={11} /> {message.attachmentCount}</> : null}</small></span>
        <time dateTime={message.sentAt}>{formatSentDate(message.sentAt)}</time>
        <span className="sent-open">Podgląd <ArrowUpRight size={14} /></span>
      </Link>)}
    </section> : <section className="sent-empty"><span><MailCheck size={28} /></span><h2>Jeszcze nic tutaj nie ma</h2><p>Pierwsza pomyślnie wysłana wiadomość pojawi się w tym miejscu.</p><Link href="/dashboard/wysylki">Utwórz wiadomość <ArrowUpRight size={15} /></Link></section>}
  </main>;
}

function formatSentDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Warsaw" }).format(new Date(value));
}
