"use client";

import { Eye, LoaderCircle, Paperclip, PenLine, Send, Settings2, X } from "lucide-react";
import { useState } from "react";
import { OfferEmailContent } from "@/emails/offer-email";
import { RichTextEditor } from "@/components/rich-text-editor";

type Status = { type: "idle" | "working" | "success" | "error"; message?: string };

export function MailComposer({ initialSignature }: { initialSignature: string }) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
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
    setStatus({ type: "working", message: "Wysyłanie wiadomości…" });
    try {
      const response = await fetch("/api/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to, cc, subject, templateLabel, html }) });
      const result = await response.json() as { sent?: number; error?: string; warning?: string };
      if (!response.ok) throw new Error(result.error ?? "Nie udało się wysłać wiadomości.");
      setStatus({ type: "success", message: result.warning ?? `Wysłano ${result.sent ?? 1} ${result.sent === 1 ? "wiadomość" : "wiadomości"} i zapisano w archiwum.` });
      setTo(""); setCc(""); setSubject(""); setTemplateLabel("Propozycja współpracy"); setHtml("<p></p>");
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Nie udało się wysłać wiadomości." });
    }
  }

  return <>
    <form className="composer-grid" onSubmit={sendMessage}>
      <section className="compose-card">
        <div className="compose-card-header"><div><span className="section-kicker"><PenLine size={13} /> NOWA WIADOMOŚĆ</span><h2>Treść wiadomości</h2></div><button className="secondary-button" type="button" onClick={() => setPreviewOpen(true)}><Eye size={16} /> Podgląd</button></div>
        <div className="mail-fields">
          <label><span>Do</span><textarea value={to} onChange={(event) => setTo(event.target.value)} rows={2} placeholder="kontakt@firma.pl, druga@firma.pl" required /><small>Wiele adresów oddziel przecinkiem. Każdy odbiorca otrzyma osobną wiadomość.</small></label>
          <label><span>DW <em>opcjonalnie</em></span><input value={cc} onChange={(event) => setCc(event.target.value)} type="text" placeholder="adres@firma.pl" /></label>
          <label><span>Temat</span><input value={subject} onChange={(event) => setSubject(event.target.value)} type="text" placeholder="Temat wiadomości" maxLength={200} required /></label>
          <label><span>Etykieta</span><input value={templateLabel} onChange={(event) => setTemplateLabel(event.target.value)} type="text" placeholder="Propozycja współpracy" maxLength={60} required /><small>Krótki napis widoczny w prawym górnym rogu wiadomości.</small></label>
        </div>
        <div className="editor-label">Wiadomość</div>
        <RichTextEditor value={html} onChange={setHtml} label="Treść wiadomości" />
        <div className="attachments-section disabled" aria-disabled="true">
          <div className="attachments-heading"><div><Paperclip size={16} /><span>Załączniki</span><small>Funkcja wyłączona</small></div><button type="button" className="text-button" disabled>Dodaj pliki</button></div>
          <div className="attachment-drop disabled"><Paperclip size={19} /><span>Załączniki będą dostępne wkrótce</span><small>Pole jest obecnie wyłączone</small></div>
        </div>
      </section>
      <aside className="compose-sidebar">
        <section className="compose-side-card"><div className="sender-icon">CC</div><div><span className="side-label">NADAWCA</span><strong>Cezary Czerwiński</strong><small>biuro@ccconsulting.pl</small></div></section>
        <section className="compose-side-card signature-summary"><div className="side-card-title"><div><Settings2 size={16} /><span>Podpis</span></div><button type="button" onClick={() => setSignatureOpen(true)}>Edytuj</button></div>{signature ? <div className="signature-mini" dangerouslySetInnerHTML={{ __html: signature }} /> : <p>Podpis nie został jeszcze ustawiony.</p>}</section>
        {status.type !== "idle" && <div className={`composer-status ${status.type}`} role={status.type === "error" ? "alert" : "status"}>{status.type === "working" && <LoaderCircle size={16} className="spinner" />}<span>{status.message}</span></div>}
        <button className="send-button" type="submit" disabled={status.type === "working"}><Send size={17} /> Wyślij wiadomość</button>
        <p className="send-note">Wiadomości są wysyłane osobno do każdego odbiorcy przez Resend.</p>
      </aside>
    </form>

    {signatureOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSignatureOpen(false); }}><section className="compose-modal" role="dialog" aria-modal="true" aria-labelledby="signature-title"><header><div><span className="section-kicker">USTAWIENIA WIADOMOŚCI</span><h2 id="signature-title">Mój podpis</h2></div><button type="button" aria-label="Zamknij" onClick={() => setSignatureOpen(false)}><X size={19} /></button></header><p>Podpis zostanie automatycznie dodany na końcu każdej wysłanej wiadomości.</p><RichTextEditor value={signatureDraft} onChange={setSignatureDraft} label="Podpis wiadomości" minHeight={170} /><footer><button className="secondary-button" type="button" onClick={() => setSignatureOpen(false)}>Anuluj</button><button className="primary-small-button" type="button" onClick={saveSignature} disabled={status.type === "working"}>Zapisz podpis</button></footer></section></div>}

    {previewOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false); }}><section className="compose-modal preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title"><header><div><span className="section-kicker">PODGLĄD WIADOMOŚCI</span><h2 id="preview-title">Tak zobaczy ją odbiorca</h2></div><button type="button" aria-label="Zamknij" onClick={() => setPreviewOpen(false)}><X size={19} /></button></header><div className="email-template-preview"><OfferEmailContent bodyHtml={html} signatureHtml={signature} subject={subject || "Bez tematu"} templateLabel={templateLabel || "Propozycja współpracy"} /></div><footer><button className="primary-small-button" type="button" onClick={() => setPreviewOpen(false)}>Wróć do edycji</button></footer></section></div>}
  </>;
}
