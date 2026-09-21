"use client";

import { upload } from "@vercel/blob/client";
import { Eye, FileText, LoaderCircle, MailPlus, Paperclip, PenLine, Send, Settings2, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { RichTextEditor } from "@/components/rich-text-editor";

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const acceptedFiles = ".pdf,.jpg,.jpeg,.png,.webp,.txt,.csv,.zip,.doc,.docx,.xls,.xlsx";

type UploadedAttachment = { url: string; pathname: string; filename: string; size: number; contentType: string };
type Status = { type: "idle" | "working" | "success" | "error"; message?: string };

export function MailComposer({ initialSignature }: { initialSignature: string }) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("<p></p>");
  const [signature, setSignature] = useState(initialSignature);
  const [signatureDraft, setSignatureDraft] = useState(initialSignature || "<p><strong>Cezary Czerwiński</strong></p><p>CC Consulting</p>");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    const next = [...files, ...Array.from(selected)].slice(0, 10);
    const size = next.reduce((sum, file) => sum + file.size, 0);
    if (size > MAX_ATTACHMENT_BYTES) {
      setStatus({ type: "error", message: "Załączniki mogą mieć łącznie maksymalnie 20 MB." });
      return;
    }
    setFiles(next);
    setStatus({ type: "idle" });
    if (fileInput.current) fileInput.current.value = "";
  }

  async function saveSignature() {
    setStatus({ type: "working", message: "Zapisywanie podpisu…" });
    const response = await fetch("/api/signature", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ html: signatureDraft }) });
    const result = await response.json() as { signature?: string; error?: string };
    if (!response.ok) return setStatus({ type: "error", message: result.error ?? "Nie udało się zapisać podpisu." });
    setSignature(result.signature ?? "");
    setSignatureOpen(false);
    setStatus({ type: "success", message: "Podpis został zapisany." });
  }

  async function cleanupUploads(attachments: UploadedAttachment[]) {
    if (!attachments.length) return;
    await fetch("/api/blob/upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls: attachments.map((item) => item.url) }) }).catch(() => undefined);
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    setStatus({ type: "working", message: files.length ? "Przesyłanie załączników…" : "Wysyłanie wiadomości…" });
    setUploadProgress(0);
    const uploaded: UploadedAttachment[] = [];
    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120) || "attachment";
        const blob = await upload(`attachments/${crypto.randomUUID()}-${safeName}`, file, {
          access: "private",
          handleUploadUrl: "/api/blob/upload",
          onUploadProgress: ({ percentage }) => setUploadProgress(Math.round(((index + percentage / 100) / files.length) * 100)),
        });
        uploaded.push({ url: blob.url, pathname: blob.pathname, filename: file.name, size: file.size, contentType: file.type });
      }
      setStatus({ type: "working", message: "Wysyłanie wiadomości…" });
      const response = await fetch("/api/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to, cc, subject, html, attachments: uploaded }) });
      const result = await response.json() as { sent?: number; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Nie udało się wysłać wiadomości.");
      setStatus({ type: "success", message: `Wysłano ${result.sent ?? 1} ${result.sent === 1 ? "wiadomość" : "wiadomości"}.` });
      setTo(""); setCc(""); setSubject(""); setHtml("<p></p>"); setFiles([]);
    } catch (error) {
      await cleanupUploads(uploaded);
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Nie udało się wysłać wiadomości." });
    }
  }

  return <>
    <form className="composer-grid" onSubmit={sendMessage}>
      <section className="compose-card">
        <div className="compose-card-header"><div><span className="section-kicker"><PenLine size={13} /> NOWA WIADOMOŚĆ</span><h2>Treść oferty</h2></div><button className="secondary-button" type="button" onClick={() => setPreviewOpen(true)}><Eye size={16} /> Podgląd</button></div>
        <div className="mail-fields">
          <label><span>Do</span><textarea value={to} onChange={(event) => setTo(event.target.value)} rows={2} placeholder="kontakt@firma.pl, druga@firma.pl" required /><small>Wiele adresów oddziel przecinkiem. Każdy odbiorca otrzyma osobną wiadomość.</small></label>
          <label><span>DW <em>opcjonalnie</em></span><input value={cc} onChange={(event) => setCc(event.target.value)} type="text" placeholder="adres@firma.pl" /></label>
          <label><span>Temat</span><input value={subject} onChange={(event) => setSubject(event.target.value)} type="text" placeholder="Temat wiadomości" maxLength={200} required /></label>
        </div>
        <div className="editor-label">Wiadomość</div>
        <RichTextEditor value={html} onChange={setHtml} label="Treść wiadomości" />
        <div className="attachments-section">
          <div className="attachments-heading"><div><Paperclip size={16} /><span>Załączniki</span><small>{formatBytes(totalSize)} / 20 MB</small></div><button type="button" className="text-button" onClick={() => fileInput.current?.click()}><MailPlus size={15} /> Dodaj pliki</button></div>
          <input ref={fileInput} className="visually-hidden" type="file" multiple accept={acceptedFiles} onChange={(event) => addFiles(event.target.files)} />
          {files.length ? <div className="attachment-list">{files.map((file, index) => <div className="attachment-item" key={`${file.name}-${file.size}-${index}`}><span className="file-icon"><FileText size={16} /></span><div><strong>{file.name}</strong><small>{formatBytes(file.size)}</small></div><button type="button" aria-label={`Usuń ${file.name}`} onClick={() => setFiles(files.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button></div>)}</div> : <button className="attachment-drop" type="button" onClick={() => fileInput.current?.click()}><Paperclip size={19} /><span>Dodaj dokumenty lub obrazy</span><small>PDF, DOCX, XLSX, ZIP, obrazy · maks. 10 plików</small></button>}
        </div>
      </section>
      <aside className="compose-sidebar">
        <section className="compose-side-card"><div className="sender-icon">CC</div><div><span className="side-label">NADAWCA</span><strong>Cezary Czerwiński</strong><small>biuro@ccconsulting.pl</small></div></section>
        <section className="compose-side-card signature-summary"><div className="side-card-title"><div><Settings2 size={16} /><span>Podpis</span></div><button type="button" onClick={() => setSignatureOpen(true)}>Edytuj</button></div>{signature ? <div className="signature-mini" dangerouslySetInnerHTML={{ __html: signature }} /> : <p>Podpis nie został jeszcze ustawiony.</p>}</section>
        {status.type !== "idle" && <div className={`composer-status ${status.type}`} role={status.type === "error" ? "alert" : "status"}>{status.type === "working" && <LoaderCircle size={16} className="spinner" />}<span>{status.message}{status.type === "working" && files.length > 0 && uploadProgress > 0 ? ` ${uploadProgress}%` : ""}</span></div>}
        <button className="send-button" type="submit" disabled={status.type === "working"}><Send size={17} /> Wyślij wiadomość</button>
        <p className="send-note">Wiadomości są wysyłane osobno do każdego odbiorcy przez Resend.</p>
      </aside>
    </form>

    {signatureOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSignatureOpen(false); }}><section className="compose-modal" role="dialog" aria-modal="true" aria-labelledby="signature-title"><header><div><span className="section-kicker">USTAWIENIA WIADOMOŚCI</span><h2 id="signature-title">Mój podpis</h2></div><button type="button" aria-label="Zamknij" onClick={() => setSignatureOpen(false)}><X size={19} /></button></header><p>Podpis zostanie automatycznie dodany na końcu każdej wysłanej wiadomości.</p><RichTextEditor value={signatureDraft} onChange={setSignatureDraft} label="Podpis wiadomości" minHeight={170} /><footer><button className="secondary-button" type="button" onClick={() => setSignatureOpen(false)}>Anuluj</button><button className="primary-small-button" type="button" onClick={saveSignature} disabled={status.type === "working"}>Zapisz podpis</button></footer></section></div>}

    {previewOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false); }}><section className="compose-modal preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title"><header><div><span className="section-kicker">PODGLĄD WIADOMOŚCI</span><h2 id="preview-title">{subject || "Bez tematu"}</h2></div><button type="button" aria-label="Zamknij" onClick={() => setPreviewOpen(false)}><X size={19} /></button></header><div className="email-preview"><div dangerouslySetInnerHTML={{ __html: html }} />{signature && <><hr /><div className="preview-signature" dangerouslySetInnerHTML={{ __html: signature }} /></>}</div><footer><button className="primary-small-button" type="button" onClick={() => setPreviewOpen(false)}>Wróć do edycji</button></footer></section></div>}
  </>;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
