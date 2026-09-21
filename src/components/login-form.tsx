"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";
import { login } from "@/app/actions";

export const REMEMBERED_SECRET_KEY = "ccconsulting-webmail-secret";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: "" });
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(true);
  const secretInput = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const attemptedAutomaticLogin = useRef(false);

  useEffect(() => {
    const savedSecret = window.localStorage.getItem(REMEMBERED_SECRET_KEY);
    if (!savedSecret || !secretInput.current || attemptedAutomaticLogin.current) return;

    attemptedAutomaticLogin.current = true;
    secretInput.current.value = savedSecret;
    form.current?.requestSubmit();
  }, []);

  useEffect(() => {
    if (state.error && attemptedAutomaticLogin.current) {
      window.localStorage.removeItem(REMEMBERED_SECRET_KEY);
      attemptedAutomaticLogin.current = false;
    }
  }, [state.error]);

  function rememberSecret() {
    const value = secretInput.current?.value ?? "";
    if (remember && value) window.localStorage.setItem(REMEMBERED_SECRET_KEY, value);
    else window.localStorage.removeItem(REMEMBERED_SECRET_KEY);
  }

  return <form ref={form} action={action} className="login-form" onSubmit={rememberSecret}>
    <label htmlFor="secret">Klucz dostępu</label>
    <div className="input-wrap">
      <KeyRound size={18} className="input-icon" aria-hidden="true" />
      <input ref={secretInput} id="secret" name="secret" type={visible ? "text" : "password"} placeholder="Mój klucz dostępu" autoComplete="current-password" required maxLength={1024} aria-invalid={Boolean(state.error)} aria-describedby={state.error ? "login-error" : "key-hint"} disabled={pending} spellCheck={false} autoCapitalize="none" />
      <button className="reveal-button" type="button" aria-label={visible ? "Ukryj klucz" : "Pokaż klucz"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
    </div>
    <p className="field-hint" id="key-hint">Jeden klucz. Dostęp do mojej przestrzeni.</p>
    <label className="remember-option">
      <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
      <span className="custom-checkbox" aria-hidden="true"><Check size={12} strokeWidth={2.5} /></span>
      Zapamiętaj klucz na tym urządzeniu
    </label>
    {state.error && <p className="form-error" id="login-error" role="alert">{state.error}</p>}
    <button className="primary-button" type="submit" disabled={pending}>{pending ? <>Weryfikowanie <LoaderCircle size={18} className="spinner" /></> : <>Przejdź do panelu <ArrowRight size={18} /></>}</button>
  </form>;
}
