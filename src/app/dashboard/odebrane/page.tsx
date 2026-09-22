import Link from "next/link";
import { getConversations } from "@/lib/conversation-store";

export const metadata = { title: "Odebrane · Rozmowy" };
export const dynamic = "force-dynamic";
export default async function InboxPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string; q?: string }> }) {
  const params = await searchParams;
  const status = params.status === "pending" || params.status === "answered" ? params.status : "all";
  const query = (params.q || "").trim().slice(0, 200);
  let data;
  try { data = await getConversations(); } catch { /* Storage errors must not look like an empty inbox. */ }
  const conversations = data?.conversations ?? [];
  const pending = conversations.filter((item) => !item.answered).length;
  const filtered = conversations.filter((item) => (status === "all" || item.answered === (status === "answered")) && (!query || item.incoming.some((mail) => `${mail.subject} ${mail.from.name} ${mail.from.address}`.toLowerCase().includes(query.toLowerCase()))));
  const pages = Math.max(1, Math.ceil(filtered.length / 25));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(params.page) || 1)));
  const url = (filter: string, page = 1) => `?${new URLSearchParams({ status: filter, q: query, page: String(page) })}`;
  return <main className="dashboard-content sent-content">
    <div className="dashboard-heading"><div><div className="eyebrow muted">MOJA POCZTA · ROZMOWY</div><h1>Odebrane</h1><p>{pending} rozmów do odpowiedzi.</p></div><form action="/dashboard/odebrane"><button className="secondary-button" type="submit">Odśwież</button></form></div>
    {!data ? <p role="alert" className="composer-status error">Nie udało się odczytać rozmów. Odśwież stronę.</p> : <>
      {!!data.failed && <p role="alert" className="composer-status error">Nie odczytano {data.failed} wiadomości. Historia i statusy mogą być niepełne.</p>}
      <div className="conversation-tools"><nav aria-label="Filtr rozmów">{[["all", "Wszystkie", conversations.length], ["pending", "Do odpowiedzi", pending], ["answered", "Odpowiedziano", conversations.length - pending]].map(([key, label, count]) => <Link key={key} href={url(String(key))} className={status === key ? "active" : ""}>{label} <span>{count}</span></Link>)}</nav><form><input type="hidden" name="status" value={status} /><input aria-label="Szukaj rozmowy" name="q" defaultValue={query} placeholder="Rozmówca, e-mail lub temat…" /><button className="secondary-button">Szukaj</button></form></div>
      <p className="template-help">Status dotyczy odpowiedzi na ostatnią wiadomość rozmówcy wysłanej z aplikacji. Odpowiedzi wysłane wyłącznie z Gmaila nie są tu oznaczane.</p>
      {!filtered.length ? <section className="sent-empty"><h2>Brak rozmów do wyświetlenia</h2></section> : <section className="conversation-list" aria-label="Rozmowy">
        {filtered.slice((page - 1) * 25, page * 25).map((conversation) => <Link className={`conversation-row sent-row ${conversation.answered ? "answered" : "pending"}`} href={`/dashboard/odebrane/${conversation.id}`} key={conversation.id}>
          <div className="conversation-person"><strong>{conversation.latest.from.name || conversation.latest.from.address}</strong><small>{conversation.latest.from.address}</small></div>
          <div className="conversation-copy"><strong>{conversation.latest.subject.replace(/^(?:\s*re\s*:\s*)+/i, "")}</strong><p>{conversation.latest.text.replace(/\s+/g, " ").slice(0, 120) || "Otwórz rozmowę"}</p><small>{conversation.incoming.length + conversation.outgoing.length} wiadomości · {conversation.outgoing.length} wysłanych przeze mnie</small></div>
          <div className="conversation-state"><span className={`thread-status ${conversation.answered ? "answered" : "pending"}`}>{conversation.answered ? "Odpowiedziano" : "Do odpowiedzi"}</span><time>{new Date(conversation.updatedAt || 0).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", dateStyle: "short", timeStyle: "short" })}</time></div>
        </Link>)}
      </section>}
      <div className="inbox-pagination">{page > 1 && <Link className="secondary-button" href={url(status, page - 1)}>Poprzednia</Link>}<span>Strona {page} z {pages} · {filtered.length} rozmów</span>{page < pages && <Link className="secondary-button" href={url(status, page + 1)}>Następna</Link>}</div>
    </>}
  </main>;
}
