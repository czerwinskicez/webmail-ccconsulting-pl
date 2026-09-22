import type { Metadata } from "next";
import { TemplateManager } from "@/components/template-manager";
import { getTemplates } from "@/lib/template-store";
import type { MailTemplate } from "@/lib/mail-template";

export const metadata: Metadata = { title: "Szablony" };

export default async function TemplatesPage() {
  let templates: MailTemplate[] = [];
  let loadError: string | undefined;
  try { templates = await getTemplates(); }
  catch { loadError = "Nie udało się odczytać szablonów z Vercel Blob."; }
  return <main className="dashboard-content"><div className="dashboard-heading"><div><div className="eyebrow muted">MOJE WIADOMOŚCI</div><h1>Szablony</h1><p>Wygląd moich wiadomości zapisany na później.</p></div></div><TemplateManager initialTemplates={templates} loadError={loadError} /></main>;
}
