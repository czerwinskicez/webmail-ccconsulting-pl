import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/session-token";

export const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-webmail-session" : "webmail-session";

export function getSecret(): string | null {
  const secret = process.env.WEBMAIL_SECRET;
  return secret && secret.length <= 1024 ? secret : null;
}

export async function isAuthenticated(): Promise<boolean> {
  const secret = getSecret();
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return Boolean(secret && token && verifySessionToken(token, secret));
}

export async function requireSession() {
  if (!(await isAuthenticated())) redirect("/");
}
