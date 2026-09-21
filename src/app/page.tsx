import { ArrowUpRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/dashboard");

  return <main className="login-shell">
    <section className="intro-panel" aria-label="CC Consulting Webmail">
      <Brand />
      <div className="intro-content">
        <div className="eyebrow"><span className="status-dot" /> MOJA PRYWATNA PRZESTRZEŃ</div>
        <h1>Dobra komunikacja.<br /><span>Zaczyna się tutaj.</span></h1>
        <p>Wszystko, co ważne, w jednym miejscu.<br />Moja osobista przestrzeń do korespondencji.</p>
        <div className="mail-art" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="art-spark spark-one" /><div className="art-spark spark-two" />
          <div className="letter"><span /><span /><span /></div>
          <div className="envelope"><div className="envelope-fold" /><Mail size={28} strokeWidth={1.2} /></div>
          <div className="art-badge"><ShieldCheck size={18} /></div>
        </div>
      </div>
      <div className="intro-footer"><span>CC Consulting</span><span>Prosto. Prywatnie. Po mojemu. <ArrowUpRight size={14} /></span></div>
    </section>
    <section className="access-panel" aria-labelledby="login-title">
      <div className="access-top"><LockKeyhole size={13} /> Tylko dla mnie</div>
      <div className="login-content">
        <div className="section-icon"><KeyIcon /></div>
        <span className="eyebrow muted">PRYWATNY DOSTĘP</span>
        <h2 id="login-title">Mój Webmail.</h2>
        <p className="login-description">Moja korespondencja, w jednym miejscu.<br className="desktop-break" /> Dostęp za pomocą klucza.</p>
        <LoginForm />
        <div className="access-note"><ShieldCheck size={17} /><span>Moja przestrzeń jest chroniona.<br /><span>Klucz dostępu pozostaje poufny.</span></span></div>
      </div>
      <footer className="access-footer"><span>© {new Date().getFullYear()} CC Consulting</span><span>Webmail <span className="version-dot">·</span> v0.1</span></footer>
    </section>
  </main>;
}

function KeyIcon() { return <LockKeyhole size={23} strokeWidth={1.5} />; }
