import type { Metadata } from "next";
import { UsersRound } from "lucide-react";
import { SenderManager } from "@/components/sender-manager";
import { getSenders } from "@/lib/sender-store";

export const metadata: Metadata = { title: "Nadawcy" };

export default async function SendersPage() {
  const senders = await getSenders();
  return <main className="dashboard-content senders-content">
    <div className="dashboard-heading senders-heading"><div><div className="eyebrow muted"><UsersRound size={13} /> USTAWIENIA WYSYŁKI</div><h1>Nadawcy</h1><p>Zarządzaj adresami, z których wysyłam wiadomości.</p></div><span className="sent-count">{senders.length} {senders.length === 1 ? "nadawca" : "nadawców"}</span></div>
    <SenderManager initialSenders={senders} />
  </main>;
}
