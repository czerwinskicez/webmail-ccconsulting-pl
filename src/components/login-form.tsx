"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";
import { login } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: "" });
  const [visible, setVisible] = useState(false);

  return <form action={action} className="login-form">
    <label htmlFor="secret">Klucz dostępu</label>
    <div className="input-wrap">
      <KeyRound size={18} className="input-icon" aria-hidden="true" />
      <input id="secret" name="secret" type={visible ? "text" : "password"} placeholder="Mój klucz dostępu" autoComplete="current-password" required maxLength={1024} aria-invalid={Boolean(state.error)} aria-describedby={state.error ? "login-error" : "key-hint"} disabled={pending} spellCheck={false} autoCapitalize="none" />
      <button className="reveal-button" type="button" aria-label={visible ? "Ukryj klucz" : "Pokaż klucz"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
    </div>
    <p className="field-hint" id="key-hint">Jeden klucz. Dostęp do mojej przestrzeni.</p>
    {state.error && <p className="form-error" id="login-error" role="alert">{state.error}</p>}
    <button className="primary-button" type="submit" disabled={pending}>{pending ? <>Weryfikowanie <LoaderCircle size={18} className="spinner" /></> : <>Przejdź do panelu <ArrowRight size={18} /></>}</button>
  </form>;
}
