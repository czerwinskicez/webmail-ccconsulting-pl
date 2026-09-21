"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, getSecret } from "@/lib/auth";
import { createSessionToken, matchesSecret, SESSION_SECONDS } from "@/lib/session-token";

export type LoginState = { error: string };

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const secret = getSecret();
  if (!secret) return { error: "Logowanie nie jest jeszcze skonfigurowane. Ustaw klucz WEBMAIL_SECRET w konfiguracji aplikacji." };
  const input = formData.get("secret");
  if (typeof input !== "string" || !input || input.length > 1024 || !matchesSecret(input, secret)) {
    return { error: "Nieprawidłowy klucz dostępu. Spróbuj ponownie." };
  }
  (await cookies()).set(COOKIE_NAME, createSessionToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  redirect("/dashboard");
}

export async function logout() {
  (await cookies()).delete(COOKIE_NAME);
  redirect("/");
}
