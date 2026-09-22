"use client";

import { useEffect, useState } from "react";
import type { TemplateValues } from "@/lib/mail-template";

export function TemplatePreview({ html, bodyHtml, signatureHtml, subject, templateLabel, replyHistoryHtml = "" }: TemplateValues & { html: string; replyHistoryHtml?: string }) {
  const [result, setResult] = useState<{ html?: string; error?: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/templates/preview", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ html, bodyHtml, signatureHtml, subject, templateLabel, replyHistoryHtml }) });
        const data = await response.json();
        if (!controller.signal.aborted) setResult(data);
      } catch {
        if (!controller.signal.aborted) setResult({ error: "Nie udało się wczytać podglądu." });
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [html, bodyHtml, signatureHtml, subject, templateLabel, replyHistoryHtml]);
  if (result?.error) return <p role="alert" className="composer-status error">{result.error}</p>;
  if (!result?.html) return <p role="status">Przygotowywanie podglądu…</p>;
  return <iframe className="template-frame" title="Podgląd szablonu wiadomości" sandbox="" referrerPolicy="no-referrer" srcDoc={result.html} />;
}
