"use client";

import { Check, LoaderCircle, Pencil, Plus, Star, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import type { MailSender } from "@/lib/sender-store";

type Status = { type: "idle" | "working" | "success" | "error"; message?: string };

export function SenderManager({ initialSenders }: { initialSenders: MailSender[] }) {
  const [senders, setSenders] = useState(initialSenders);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function request(method: string, body?: Record<string, string>, query = "") {
    setStatus({ type: "working", message: "Zapisywanie zmian…" });
    try {
      const response = await fetch(`/api/senders${query}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json() as { senders?: MailSender[]; error?: string };
      if (!response.ok || !result.senders) throw new Error(result.error ?? "Nie udało się zapisać zmian.");
      setSenders(result.senders);
      setStatus({ type: "success", message: "Lista nadawców została zapisana." });
      return true;
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Nie udało się zapisać zmian." });
      return false;
    }
  }

  async function saveSender(event: React.FormEvent) {
    event.preventDefault();
    const saved = await request(editingId ? "PUT" : "POST", { ...(editingId ? { id: editingId } : {}), name, email });
    if (saved) cancelEditing();
  }

  function edit(sender: MailSender) {
    setEditingId(sender.id);
    setName(sender.name);
    setEmail(sender.email);
    setStatus({ type: "idle" });
  }

  function cancelEditing() {
    setEditingId(null);
    setName("");
    setEmail("");
  }

  return <div className="senders-grid">
    <section className="senders-list-card">
      <header><div><span className="section-kicker">ZAPISANE KONTA</span><h2>Moi nadawcy</h2></div><span>{senders.length}/20</span></header>
      <div className="senders-list">
        {senders.map((sender) => <article className={`sender-row${sender.isDefault ? " default" : ""}`} key={sender.id}>
          <span className="sender-avatar">{sender.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
          <div className="sender-identity"><strong>{sender.name}</strong><small>{sender.email}</small></div>
          {sender.isDefault ? <span className="default-badge"><Check size={12} /> Domyślny</span> : <button className="sender-default-button" type="button" onClick={() => request("PATCH", { id: sender.id })} disabled={status.type === "working"}><Star size={14} /> Ustaw domyślny</button>}
          <div className="sender-actions">
            <button type="button" aria-label={`Edytuj ${sender.name}`} title="Edytuj" onClick={() => edit(sender)} disabled={status.type === "working"}><Pencil size={15} /></button>
            <button type="button" aria-label={`Usuń ${sender.name}`} title="Usuń" onClick={() => request("DELETE", undefined, `?id=${encodeURIComponent(sender.id)}`)} disabled={status.type === "working" || senders.length === 1}><Trash2 size={15} /></button>
          </div>
        </article>)}
      </div>
    </section>

    <aside className="sender-form-card">
      <span className="sender-form-icon"><UserRound size={20} /></span>
      <span className="section-kicker">{editingId ? "EDYCJA NADAWCY" : "NOWY NADAWCA"}</span>
      <h2>{editingId ? "Zmień dane" : "Dodaj konto"}</h2>
      <p>Nazwa i adres pojawią się odbiorcy w polu nadawcy wiadomości.</p>
      <form onSubmit={saveSender}>
        <label>Nazwa nadawcy<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Cezary Czerwiński" maxLength={100} required /></label>
        <label>Adres e-mail<input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="biuro@ccconsulting.pl" type="email" maxLength={254} required /></label>
        <button className="send-button" type="submit" disabled={status.type === "working"}>{status.type === "working" ? <LoaderCircle className="spinner" size={17} /> : editingId ? <Check size={17} /> : <Plus size={17} />}{editingId ? "Zapisz zmiany" : "Dodaj nadawcę"}</button>
        {editingId && <button className="secondary-button sender-cancel" type="button" onClick={cancelEditing}>Anuluj edycję</button>}
      </form>
      {status.type !== "idle" && status.type !== "working" && <div className={`composer-status ${status.type}`} role={status.type === "error" ? "alert" : "status"}>{status.message}</div>}
      <small className="sender-form-note">Adres musi należeć do domeny zweryfikowanej w Resend, aby wysyłka była możliwa.</small>
    </aside>
  </div>;
}
