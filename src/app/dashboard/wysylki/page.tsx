import type { Metadata } from "next";
import { MailPlus } from "lucide-react";
import { MailComposer } from "@/components/mail-composer";
import { getSignature } from "@/lib/signature-store";

export const metadata: Metadata = { title: "Wysyłki" };

export default async function MailingsPage() {
  const signature = await getSignature();
  return <main className="dashboard-content mailings-content">
    <div className="dashboard-heading mailings-heading"><div><div className="eyebrow muted"><MailPlus size={13} /> WYSYŁKI OFERTOWE</div><h1>Nowa wiadomość</h1><p>Przygotuj ofertę i wyślij ją do wybranych odbiorców.</p></div><span className="sender-badge">Cezary Czerwiński · biuro@ccconsulting.pl</span></div>
    <MailComposer initialSignature={signature} />
  </main>;
}
