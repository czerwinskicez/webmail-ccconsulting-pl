"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/actions";
import { REMEMBERED_SECRET_KEY } from "@/components/login-form";

export function LogoutForm() {
  return <form action={logout} onSubmit={() => window.localStorage.removeItem(REMEMBERED_SECRET_KEY)}>
    <button className="logout-button" type="submit"><LogOut size={16} /> Wyloguj się</button>
  </form>;
}
