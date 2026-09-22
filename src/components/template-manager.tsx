"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { MailTemplate } from "@/lib/mail-template";
import { TemplatePreview } from "./template-preview";

export function TemplateManager({ initialTemplates, loadError }: { initialTemplates: MailTemplate[]; loadError?: string }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [id, setId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [html, setHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  function reset() { setId(null); setName(""); setHtml(""); setPreview(false); }

  async function save(method: string, targetId = id) {
    setBusy(true); setError(""); setStatus("");
    try {
      const response = await fetch("/api/templates", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: targetId, name, html }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Nie udało się zapisać zmian.");
      setTemplates(result.templates);
      if (method !== "DELETE" || targetId === id) reset();
      setStatus(method === "DELETE" ? "Szablon został usunięty." : "Szablon został zapisany.");
    } catch (err) { setError(err instanceof Error ? err.message : "Nie udało się zapisać zmian."); }
    finally { setBusy(false); }
  }

  return <div className="templates-layout">
    {loadError && <p className="composer-status error" role="alert">{loadError} Odśwież stronę, aby spróbować ponownie.</p>}
    <section className="senders-list-card">
      <header><h2>Moje szablony</h2><span>{templates.length}/20</span></header>
      {!templates.length && <p className="template-help">Brak zapisanych szablonów. Wysyłka korzysta obecnie z wbudowanego wyglądu wiadomości.</p>}
      {templates.map((template) => <div className="template-row" key={template.id}><strong>{template.name}</strong><div className="sender-actions"><button type="button" disabled={busy} aria-label={`Edytuj ${template.name}`} onClick={() => { setId(template.id); setName(template.name); setHtml(template.html); setPreview(false); setError(""); setStatus(""); }}><Pencil size={16} /></button><button type="button" disabled={busy || !!loadError} aria-label={`Usuń ${template.name}`} onClick={() => save("DELETE", template.id)}><Trash2 size={16} /></button></div></div>)}
    </section>
    <section className="compose-card template-editor">
      <div className="compose-card-header"><h2>{id ? "Edytuj szablon" : "Nowy szablon"}</h2>{id && <button className="secondary-button" type="button" disabled={busy} onClick={reset}><Plus size={15} /> Nowy</button>}</div>
      <form onSubmit={(event) => { event.preventDefault(); void save(id ? "PUT" : "POST"); }}>
        <div className="mail-fields"><label><span>Nazwa</span><input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Nazwa mojego szablonu" disabled={busy} /></label></div>
        <p className="template-help">Wklej HTML wiadomości ze stylami inline. W miejscach tekstu użyj: <code>{"{{body}}"}</code> — treść (wymagane), <code>{"{{signature}}"}</code> — podpis, <code>{"{{subject}}"}</code> — temat, <code>{"{{label}}"}</code> — etykieta. Zmienne wstawiaj poza atrybutami HTML. Skrypty, formularze i bloki &lt;style&gt; są usuwane.</p>
        <label className="editor-label" htmlFor="template-html">Kod HTML</label>
        <textarea id="template-html" className="template-code" value={html} onChange={(event) => setHtml(event.target.value)} required maxLength={100000} spellCheck={false} disabled={busy} placeholder="Wklej kod HTML szablonu…" />
        <div className="template-buttons"><button className="secondary-button" type="button" onClick={() => setPreview(!preview)}>{preview ? "Ukryj podgląd" : "Podgląd"}</button><button className="primary-small-button" disabled={busy || !!loadError}>{busy ? "Zapisywanie…" : "Zapisz szablon"}</button></div>
      </form>
      {error && <p role="alert" className="composer-status error">{error}</p>}{status && <p role="status" className="composer-status success">{status}</p>}
      {preview && <TemplatePreview html={html} bodyHtml="<p>Dzień dobry,</p><p>Tak będzie wyglądać treść mojej wiadomości.</p>" signatureHtml="<p>Moje imię i nazwisko</p>" subject="Przykładowy temat" templateLabel="Propozycja współpracy" />}
      <p className="template-help"><a href="/templates/cc-consulting.html" download>Pobierz HTML obecnego szablonu</a> — otwórz plik w edytorze tekstu i skopiuj go do pola powyżej. Pobranie nie dodaje szablonu do listy.</p>
    </section>
  </div>;
}
