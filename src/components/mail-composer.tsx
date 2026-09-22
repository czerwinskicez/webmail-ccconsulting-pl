"use client";

import { Eye, LoaderCircle, MailPlus, Paperclip, PenLine, Send, Settings2, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { OfferEmailContent } from "@/emails/offer-email";
import { RichTextEditor } from "@/components/rich-text-editor";
import type { MailSender } from "@/lib/sender-store";
import type { MailTemplate } from "@/lib/mail-template";
import { TemplatePreview } from "./template-preview";
import type { ReplyDraft } from "@/lib/inbound-mail";

type Status = { type: "idle" | "working" | "success" | "error"; message?: string };

export function MailComposer({ initialSignature, senders, templates, templateError, reply }: { initialSignature: string; senders: MailSender[]; templates: MailTemplate[]; templateError?: string; reply?: ReplyDraft }) {
  const defaultSender = senders.find((sender) => sender.isDefault) ?? senders[0];
  const [senderId, setSenderId] = useState(reply?.senderId ?? defaultSender.id);
  const [replySent, setReplySent] = useState(false);
  const currentSender = senders.find((sender) => sender.id === senderId) ?? defaultSender;
  const [templateId, setTemplateId] = useState("");
  const currentTemplate = templates.find((template) => template.id === templateId);
  const [to, setTo] = useState(reply?.to ?? "");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(reply?.subject ?? "");
  const [templateLabel, setTemplateLabel] = useState("Propozycja współpracy");
  const [html, setHtml] = useState("<p></p>");
  const [signature, setSignature] = useState(initialSignature);
  const [signatureDraft, setSignatureDraft] = useState(initialSignature || "<p><strong>Cezary Czerwiński</strong></p><p>CC Consulting</p>");
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function saveSignature() {
    setStatus({ type: "working", message: "Zapisywanie podpisu…" });
    const response = await fetch("/api/signature", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ html: signatureDraft }) });
    const result = await response.json() as { signature?: string; error?: string };
    if (!response.ok) return setStatus({ type: "error", message: result.error ?? "Nie udało się zapisać podpisu." });
    setSignature(result.signature ?? "");
    setSignatureOpen(false);
    setStatus({ type: "success", message: "Podpis został zapisany." });
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (replySent || status.type === "working") return;
    setStatus({ type: "working", message: "Wysyłanie wiadomości…" });
    try {
      const response = await fetch("/api/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senderId, templateId, to, cc, subject, templateLabel, html, replyToKey: reply?.key }) });
      const result = await response.json() as { sent?: number; error?: string; warning?: string };
      if (!response.ok) throw new Error(result.error ?? "Nie udało się wysłać wiadomości.");
      setStatus({ type: "success", message: result.warning ?? `Wysłano ${result.sent ?? 1} ${result.sent === 1 ? "wiadomość" : "wiadomości"} i zapisano w archiwum.` });
      if (reply) setReplySent(true);
      else { setTo(""); setCc(""); setSubject(""); setTemplateLabel("Propozycja współpracy"); setHtml("<p></p>"); }
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Nie udało się wysłać wiadomości." });
    }
  }

  return <>
    {reply && <p className="reply-context">Odpowiedź na: <a href={`/dashboard/odebrane/${reply.key}`}>{reply.subject}</a>{!reply.senderMatched && <span>Nie znaleziono nadawcy pasującego do adresu odbiorcy. Wybrane zostało konto domyślne — sprawdź pole „Od”.</span>}{replySent && <span>Odpowiedź wysłana. <Link href="/dashboard/odebrane">Wróć do odebranych</Link> lub <a href="/dashboard/wysylki">utwórz nową wiadomość</a>.</span>}</p>}
    <div className="dashboard-heading mailings-heading"><div><div className="eyebrow muted"><MailPlus size={13} /> KORESPONDENCJA</div><h1>Nowa wiadomość</h1><p>Przygotuj wiadomość i wyślij ją do wybranych odbiorców.</p></div><span className="sender-badge">{currentSender.name} · {currentSender.email}</span></div>
    <form className="composer-grid" onSubmit={sendMessage}>
      <section className="compose-card">
        <div className="compose-card-header"><div><span className="section-kicker"><PenLine size={13} /> NOWA WIADOMOŚĆ</span><h2>Treść wiadomości</h2></div><button className="secondary-button" type="button" onClick={() => setPreviewOpen(true)}><Eye size={16} /> Podgląd</button></div>
        <div className="mail-fields">
          <label><span>Szablon</span><select value={templateId} onChange={(event) => setTemplateId(event.target.value)}><option value="">Wbudowany — CC Consulting</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select><small>{templateError || (!templates.length ? "Brak zapisanych szablonów. Używany jest obecny, wbudowany wygląd wiadomości." : "Wybierz wygląd wiadomości.")} <a href="/dashboard/szablony">Zarządzaj szablonami</a></small></label>
          <label><span>Od</span><select value={senderId} onChange={(event) => setSenderId(event.target.value)} required>{senders.map((sender) => <option value={sender.id} key={sender.id}>{sender.name} · {sender.email}{sender.isDefault ? " (domyślny)" : ""}</option>)}</select></label>
          <label><span>Do</span><textarea value={to} onChange={(event) => setTo(event.target.value)} rows={2} placeholder="kontakt@firma.pl, druga@firma.pl" required /><small>Wiele adresów oddziel przecinkiem. Każdy odbiorca otrzyma osobną wiadomość.</small></label>
          <label><span>DW <em>opcjonalnie</em></span><input value={cc} onChange={(event) => setCc(event.target.value)} type="text" placeholder="adres@firma.pl" /></label>
          <label><span>Temat</span><input value={subject} onChange={(event) => setSubject(event.target.value)} type="text" placeholder="Temat wiadomości" maxLength={200} required /></label>
          <label><span>Etykieta</span><input value={templateLabel} onChange={(event) => setTemplateLabel(event.target.value)} type="text" placeholder="Propozycja współpracy" maxLength={60} required /><small>Krótki napis widoczny w prawym górnym rogu wiadomości.</small></label>
        </div>
        <div className="editor-label">Wiadomość</div>{reply && <p className="template-help">Historia z wiadomości, na którą odpowiadam, zostanie dołączona poniżej odpowiedzi. Jest widoczna w podglądzie.</p>}
        <RichTextEditor value={html} onChange={setHtml} label="Treść wiadomości" />
        <div className="attachments-section disabled" aria-disabled="true">
          <div className="attachments-heading"><div><Paperclip size={16} /><span>Załączniki</span><small>Funkcja wyłączona</small></div><button type="button" className="text-button" disabled>Dodaj pliki</button></div>
          <div className="attachment-drop disabled"><Paperclip size={19} /><span>Załączniki będą dostępne wkrótce</span><small>Pole jest obecnie wyłączone</small></div>
        </div>
      </section>
      <aside className="compose-sidebar">
        <section className="compose-side-card"><div className="sender-icon">{currentSender.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div><div><span className="side-label">NADAWCA</span><strong>{currentSender.name}</strong><small>{currentSender.email}</small></div></section>
        <section className="compose-side-card signature-summary"><div className="side-card-title"><div><Settings2 size={16} /><span>Podpis</span></div><button type="button" onClick={() => setSignatureOpen(true)}>Edytuj</button></div>{signature ? <div className="signature-mini" dangerouslySetInnerHTML={{ __html: signature }} /> : <p>Podpis nie został jeszcze ustawiony.</p>}</section>
        {status.type !== "idle" && <div className={`composer-status ${status.type}`} role={status.type === "error" ? "alert" : "status"}>{status.type === "working" && <LoaderCircle size={16} className="spinner" />}<span>{status.message}</span></div>}
        <button className="send-button" type="submit" disabled={status.type === "working" || replySent}><Send size={17} /> {reply ? "Wyślij odpowiedź" : "Wyślij wiadomość"}</button>
        <p className="send-note">Wiadomości są wysyłane osobno do każdego odbiorcy przez Resend.</p>
      </aside>
    </form>

    {signatureOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSignatureOpen(false); }}><section className="compose-modal" role="dialog" aria-modal="true" aria-labelledby="signature-title"><header><div><span className="section-kicker">USTAWIENIA WIADOMOŚCI</span><h2 id="signature-title">Mój podpis</h2></div><button type="button" aria-label="Zamknij" onClick={() => setSignatureOpen(false)}><X size={19} /></button></header><p>Podpis zostanie automatycznie dodany na końcu każdej wysłanej wiadomości.</p><RichTextEditor value={signatureDraft} onChange={setSignatureDraft} label="Podpis wiadomości" minHeight={170} /><footer><button className="secondary-button" type="button" onClick={() => setSignatureOpen(false)}>Anuluj</button><button className="primary-small-button" type="button" onClick={saveSignature} disabled={status.type === "working"}>Zapisz podpis</button></footer></section></div>}

    {previewOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false); }}><section className="compose-modal preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title"><header><div><span className="section-kicker">PODGLĄD WIADOMOŚCI</span><h2 id="preview-title">Widok odbiorcy</h2></div><button type="button" aria-label="Zamknij" onClick={() => setPreviewOpen(false)}><X size={19} /></button></header><div className="email-template-preview">{currentTemplate ? <TemplatePreview replyHistoryHtml={reply?.historyHtml} html={currentTemplate.html} bodyHtml={html} signatureHtml={signature} subject={subject || "Bez tematu"} templateLabel={templateLabel || "Propozycja współpracy"} /> : <OfferEmailContent replyHistoryHtml={reply?.historyHtml} bodyHtml={html} signatureHtml={signature} subject={subject || "Bez tematu"} templateLabel={templateLabel || "Propozycja współpracy"} />}</div><footer><button className="primary-small-button" type="button" onClick={() => setPreviewOpen(false)}>Wróć do edycji</button></footer></section></div>}
  </>;
}
