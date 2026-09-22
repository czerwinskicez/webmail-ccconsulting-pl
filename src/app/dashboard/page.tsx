import type { Metadata } from "next";
import { ArrowUpRight, Mail, MailCheck, Send, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <main className="dashboard-content">
        <div className="dashboard-heading"><div><div className="eyebrow muted">MÓJ PANEL</div><h1>Dashboard</h1><p>Moja poczta. Moje sprawy.</p></div><span className="session-badge"><span className="status-dot" /> Sesja aktywna</span></div>
        <section className="welcome-card"><div className="welcome-copy"><div className="welcome-icon"><Sparkles size={25} /></div><h2>Hello<span>.</span></h2><p>Moja osobista przestrzeń<br />do korespondencji.</p><span className="welcome-caption">Wszystko, co ważne, pod ręką. <ArrowUpRight size={16} /></span></div><div className="dashboard-art" aria-hidden="true"><div className="dashboard-art-ring" /><Mail size={88} strokeWidth={0.8} /><span className="art-badge"><ShieldCheck size={20} /></span></div></section>
        <div className="dashboard-actions">
          <Link className="dashboard-note dashboard-link" href="/dashboard/odebrane"><span className="small-icon"><Mail size={19} /></span><div><h3>Odebrane</h3><p>Przeczytaj wiadomości i odpowiedz na korespondencję.</p></div><span className="open-link">Otwórz <ArrowUpRight size={14} /></span></Link>
          <Link className="dashboard-note dashboard-link" href="/dashboard/wysylki"><span className="small-icon"><Mail size={19} /></span><div><h3>Wysyłki ofertowe</h3><p>Przygotuj i wyślij wiadomość do potencjalnych odbiorców.</p></div><span className="open-link">Otwórz <Send size={14} /></span></Link>
          <Link className="dashboard-note dashboard-link" href="/dashboard/wyslane"><span className="small-icon"><MailCheck size={19} /></span><div><h3>Wysłane wiadomości</h3><p>Przejrzyj zapisane wysyłki i ich odbiorców.</p></div><span className="open-link">Otwórz <ArrowUpRight size={14} /></span></Link>
          <Link className="dashboard-note dashboard-link" href="/dashboard/nadawcy"><span className="small-icon"><UsersRound size={19} /></span><div><h3>Nadawcy</h3><p>Skonfiguruj adresy nadawców i wybierz konto domyślne.</p></div><span className="open-link">Otwórz <ArrowUpRight size={14} /></span></Link>
          <Link className="dashboard-note dashboard-link" href="/dashboard/szablony"><span className="small-icon"><Mail size={19} /></span><div><h3>Szablony</h3><p>Zarządzaj wyglądem moich wiadomości.</p></div><span className="open-link">Otwórz <ArrowUpRight size={14} /></span></Link>
        </div>
      </main>;
}
