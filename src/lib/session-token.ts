import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_SECONDS = 60 * 60 * 24 * 7;

export function matchesSecret(input: string, secret: string): boolean {
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(input), hash(secret));
}

function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(`webmail-session-v1:${payload}`).digest("base64url");
}

export function createSessionToken(secret: string, now = Date.now()): string {
  const payload = `${Math.floor(now / 1000) + SESSION_SECONDS}.${randomBytes(24).toString("base64url")}`;
  return `${payload}.${signature(payload, secret)}`;
}

export function verifySessionToken(token: string, secret: string, now = Date.now()): boolean {
  if (token.length > 256) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expiry, nonce, supplied] = parts;
  if (!/^\d{10}$/.test(expiry) || !/^[\w-]{32}$/.test(nonce) || !/^[\w-]{43}$/.test(supplied)) return false;
  const expires = Number(expiry);
  const current = Math.floor(now / 1000);
  if (expires <= current || expires > current + SESSION_SECONDS) return false;
  return matchesSecret(supplied, signature(`${expiry}.${nonce}`, secret));
}
