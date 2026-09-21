import type { Metadata } from "next";
import { ArrowUpRight, LayoutDashboard, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Brand } from "@/components/brand";
import { requireSession } from "@/lib/auth";
import { LogoutForm } from "@/components/logout-form";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requireSession();

  return <div className="dashboard-shell">
    <aside className="sidebar">
      <Brand />
      <div className="sidebar-section">MOJA PRZESTRZEŃ</div>
      <nav aria-label="Nawigacja główna"><a className="nav-item active" href="/dashboard" aria-current="page"><LayoutDashboard size={18} /> Dashboard <span className="nav-dot" /></a></nav>
      <div className="sidebar-bottom"><span className="avatar">CC</span><div>CC Consulting<small>Moja przestrzeń</small></div><ShieldCheck size={17} /></div>
    </aside>
    <div className="dashboard-main">
      <header className="dashboard-header"><span>Moja przestrzeń <span className="breadcrumb-separator">/</span> <strong>Dashboard</strong></span><LogoutForm /></header>
      <main className="dashboard-content">
        <div className="dashboard-heading"><div><div className="eyebrow muted">MÓJ PANEL</div><h1>Dashboard</h1><p>Moja poczta. Moje sprawy.</p></div><span className="session-badge"><span className="status-dot" /> Sesja aktywna</span></div>
        <section className="welcome-card"><div className="welcome-copy"><div className="welcome-icon"><Sparkles size={25} /></div><h2>Hello<span>.</span></h2><p>Moja osobista przestrzeń<br />do korespondencji.</p><span className="welcome-caption">Wszystko, co ważne, pod ręką. <ArrowUpRight size={16} /></span></div><div className="dashboard-art" aria-hidden="true"><div className="dashboard-art-ring" /><Mail size={88} strokeWidth={0.8} /><span className="art-badge"><ShieldCheck size={20} /></span></div></section>
        <div className="dashboard-note"><span className="small-icon"><Mail size={19} /></span><div><h3>Miejsce na coś więcej</h3><p>Wkrótce pojawią się tutaj moje wiadomości.</p></div><span className="soon-badge">W przygotowaniu</span></div>
      </main>
      <footer className="dashboard-footer">© {new Date().getFullYear()} CC Consulting <span>Webmail · v0.1</span></footer>
    </div>
  </div>;
}
