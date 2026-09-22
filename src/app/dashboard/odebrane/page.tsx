import { Archive } from "lucide-react";
import Link from "next/link";
import { ArchiveButton } from "@/components/archive-button";
import { getArchiveState } from "@/lib/archive-store";
import { getConversations } from "@/lib/conversation-store";
import type { Conversation } from "@/lib/conversations";
import { isConversationArchived } from "@/lib/archive-state";

export const metadata = { title: "Odebrane · Rozmowy" };
export const dynamic = "force-dynamic";

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ page?: string; archivedPage?: string; status?: string; q?: string }> }) {
  const params = await searchParams;
  const status = params.status === "pending" || params.status === "answered" ? params.status : "all";
  const query = (params.q || "").trim().slice(0, 200);
  let data: Awaited<ReturnType<typeof getConversations>> | undefined;
  let archiveState: Awaited<ReturnType<typeof getArchiveState>> | undefined;
  try { data = await getConversations(); } catch { /* Storage errors must not look like an empty inbox. */ }
  try { archiveState = await getArchiveState(); } catch { /* Show conversations with a warning instead of hiding the inbox. */ }

  const conversations = data?.conversations ?? [];
  const archived = archiveState ? conversations.filter((item) => isConversationArchived(archiveState, item.id, item.latest.receivedAt)) : [];
  const current = archiveState ? conversations.filter((item) => !isConversationArchived(archiveState, item.id, item.latest.receivedAt)) : conversations;
  const pending = current.filter((item) => !item.answered).length;
  const matchesQuery = (item: Conversation) => !query || item.incoming.some((mail) => `${mail.subject} ${mail.from.name} ${mail.from.address}`.toLowerCase().includes(query.toLowerCase()));
  const filtered = current.filter((item) => (status === "all" || item.answered === (status === "answered")) && matchesQuery(item));
  const archivedFiltered = archived.filter(matchesQuery);
  const pages = Math.max(1, Math.ceil(filtered.length / 25));
  const archivedPages = Math.max(1, Math.ceil(archivedFiltered.length / 25));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(params.page) || 1)));
  const archivedPage = Math.min(archivedPages, Math.max(1, Math.floor(Number(params.archivedPage) || 1)));
  const url = (filter: string, nextPage = page, nextArchivedPage = archivedPage) => `?${new URLSearchParams({ status: filter, q: query, page: String(nextPage), archivedPage: String(nextArchivedPage) })}`;

  return <main className="dashboard-content sent-content">
    <div className="dashboard-heading"><div><div className="eyebrow muted">MOJA POCZTA · ROZMOWY</div><h1>Odebrane</h1><p>{pending} rozmów do odpowiedzi.</p></div><form action="/dashboard/odebrane"><button className="secondary-button" type="submit">Odśwież</button></form></div>
    {!data ? <p role="alert" className="composer-status error">Nie udało się odczytać rozmów. Odśwież stronę.</p> : <>
      {!!data.failed && <p role="alert" className="composer-status error">Nie odczytano {data.failed} wiadomości. Historia i statusy mogą być niepełne.</p>}
      {!archiveState && <p role="alert" className="composer-status error">Nie udało się odczytać stanu archiwum. Wszystkie rozmowy są tymczasowo pokazane na głównej liście.</p>}
      <div className="conversation-tools"><nav aria-label="Filtr rozmów">{[["all", "Wszystkie", current.length], ["pending", "Do odpowiedzi", pending], ["answered", "Odpowiedziano", current.length - pending]].map(([key, label, count]) => <Link key={key} href={url(String(key), 1)} className={status === key ? "active" : ""}>{label} <span>{count}</span></Link>)}</nav><form><input type="hidden" name="status" value={status} /><input aria-label="Szukaj rozmowy" name="q" defaultValue={query} placeholder="Rozmówca, e-mail lub temat…" /><button className="secondary-button">Szukaj</button></form></div>
      <p className="template-help">Status dotyczy odpowiedzi na ostatnią wiadomość rozmówcy wysłanej z aplikacji. Odpowiedzi wysłane wyłącznie z Gmaila nie są tu oznaczane.</p>

      <section className="archive-section" aria-labelledby="inbox-current-heading">
        <div className="archive-section-heading"><div><h2 id="inbox-current-heading">Bieżące rozmowy</h2><p>Nowa wiadomość automatycznie przywraca zarchiwizowany wątek na tę listę.</p></div><span>{filtered.length}</span></div>
        {filtered.length ? <ConversationList conversations={filtered.slice((page - 1) * 25, page * 25)} archived={false} /> : <section className="sent-empty compact"><h2>Brak rozmów do wyświetlenia</h2><p>Zmień filtr lub wyszukiwane hasło.</p></section>}
        {filtered.length > 0 && <div className="inbox-pagination">{page > 1 && <Link className="secondary-button" href={url(status, page - 1)}>Poprzednia</Link>}<span>Strona {page} z {pages} · {filtered.length} rozmów</span>{page < pages && <Link className="secondary-button" href={url(status, page + 1)}>Następna</Link>}</div>}
      </section>

      <section className="archive-section" aria-labelledby="inbox-archive-heading">
        <div className="archive-section-heading"><div><h2 id="inbox-archive-heading"><Archive size={17} /> Archiwum</h2><p>Odłożone rozmowy pozostają dostępne do odczytu i można je przywrócić.</p></div><span>{archivedFiltered.length}</span></div>
        {archivedFiltered.length ? <ConversationList conversations={archivedFiltered.slice((archivedPage - 1) * 25, archivedPage * 25)} archived /> : <div className="archive-empty">{query ? "Brak zarchiwizowanych rozmów pasujących do wyszukiwania." : "Nie masz zarchiwizowanych rozmów."}</div>}
        {archivedFiltered.length > 0 && <div className="inbox-pagination">{archivedPage > 1 && <Link className="secondary-button" href={url(status, page, archivedPage - 1)}>Poprzednia</Link>}<span>Strona {archivedPage} z {archivedPages} · {archivedFiltered.length} rozmów</span>{archivedPage < archivedPages && <Link className="secondary-button" href={url(status, page, archivedPage + 1)}>Następna</Link>}</div>}
      </section>
    </>}
  </main>;
}

function ConversationList({ conversations, archived }: { conversations: Conversation[]; archived: boolean }) {
  return <div className="conversation-list" aria-label={archived ? "Zarchiwizowane rozmowy" : "Bieżące rozmowy"}>
    {conversations.map((conversation) => <div className={`conversation-row sent-row ${conversation.answered ? "answered" : "pending"}`} key={conversation.id}>
      <Link className="conversation-main" href={`/dashboard/odebrane/${conversation.id}`}>
        <div className="conversation-person"><strong>{conversation.latest.from.name || conversation.latest.from.address}</strong><small>{conversation.latest.from.address}</small></div>
        <div className="conversation-copy"><strong>{conversation.latest.subject.replace(/^(?:\s*re\s*:\s*)+/i, "")}</strong><p>{conversation.latest.text.replace(/\s+/g, " ").slice(0, 120) || "Otwórz rozmowę"}</p><small>{conversation.incoming.length + conversation.outgoing.length} wiadomości · {conversation.outgoing.length} wysłanych przeze mnie</small></div>
        <div className="conversation-state"><span className={`thread-status ${conversation.answered ? "answered" : "pending"}`}>{conversation.answered ? "Odpowiedziano" : "Do odpowiedzi"}</span><time>{new Date(conversation.updatedAt || 0).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", dateStyle: "short", timeStyle: "short" })}</time></div>
      </Link>
      <ArchiveButton kind="conversation" id={conversation.id} archived={archived} />
    </div>)}
  </div>;
}
