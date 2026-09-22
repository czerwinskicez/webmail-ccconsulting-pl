"use client";

import { LayoutDashboard, LogOut, MailCheck, MailPlus, ShieldCheck, UsersRound, PanelsTopLeft, Inbox } from "lucide-react";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";
import { Brand } from "@/components/brand";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/odebrane", label: "Odebrane", icon: Inbox },
  { href: "/dashboard/wysylki", label: "Wysyłki", icon: MailPlus },
  { href: "/dashboard/wyslane", label: "Wysłane", icon: MailCheck },
  { href: "/dashboard/nadawcy", label: "Nadawcy", icon: UsersRound },
  { href: "/dashboard/szablony", label: "Szablony", icon: PanelsTopLeft },
];

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentLabel = navigation.find((item) => item.href === pathname || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)))?.label ?? "Dashboard";

  return <div className="dashboard-shell">
    <aside className="sidebar">
      <Brand />
      <div className="sidebar-section">MOJA PRZESTRZEŃ</div>
      <nav aria-label="Nawigacja główna">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          return <a key={href} className={`nav-item${active ? " active" : ""}`} href={href} aria-current={active ? "page" : undefined}><Icon size={18} /> {label} {active && <span className="nav-dot" />}</a>;
        })}
      </nav>
      <div className="sidebar-bottom"><span className="avatar">CC</span><div>CC Consulting<small>Moja przestrzeń</small></div><ShieldCheck size={17} /></div>
    </aside>
    <div className="dashboard-main">
      <header className="dashboard-header"><span>Moja przestrzeń <span className="breadcrumb-separator">/</span> <strong>{currentLabel}</strong></span><form action={logout}><button className="logout-button" type="submit"><LogOut size={16} /> Wyloguj się</button></form></header>
      {children}
      <footer className="dashboard-footer">© {new Date().getFullYear()} CC Consulting <span>Webmail · v0.2</span></footer>
    </div>
  </div>;
}
