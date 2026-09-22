import "server-only";
import { get, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";

const SENDERS_PATH = "settings/senders.json";

export type MailSender = {
  id: string;
  name: string;
  email: string;
  isDefault: boolean;
};

const initialSender: MailSender = {
  id: "cc-consulting-biuro",
  name: "Cezary Czerwiński",
  email: "biuro@ccconsulting.pl",
  isDefault: true,
};

function normalizeName(value: unknown): string {
  if (typeof value !== "string") return "";
  const name = value.trim().replace(/\s+/g, " ");
  return name.length <= 100 && !/[<>\r\n]/.test(name) ? name : "";
}

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  const email = value.trim().toLowerCase();
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) && email.length <= 254 ? email : "";
}

function normalizeSenders(value: unknown): MailSender[] {
  if (!Array.isArray(value)) return [];
  const senders = value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Partial<MailSender>;
    const id = typeof candidate.id === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(candidate.id) ? candidate.id : "";
    const name = normalizeName(candidate.name);
    const email = normalizeEmail(candidate.email);
    return id && name && email ? [{ id, name, email, isDefault: candidate.isDefault === true }] : [];
  }).slice(0, 20);
  if (!senders.length) return [];
  const defaultIndex = Math.max(0, senders.findIndex((sender) => sender.isDefault));
  return senders.map((sender, index) => ({ ...sender, isDefault: index === defaultIndex }));
}

async function writeSenders(senders: MailSender[]): Promise<void> {
  await put(SENDERS_PATH, JSON.stringify(senders), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
    cacheControlMaxAge: 0,
  });
}

export async function getSenders(): Promise<MailSender[]> {
  try {
    const result = await get(SENDERS_PATH, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return [initialSender];
    const senders = normalizeSenders(JSON.parse(await new Response(result.stream).text()));
    return senders.length ? senders : [initialSender];
  } catch {
    return [initialSender];
  }
}

export async function addSender(nameValue: unknown, emailValue: unknown): Promise<MailSender[]> {
  const name = normalizeName(nameValue);
  const email = normalizeEmail(emailValue);
  if (!name) throw new Error("Podaj poprawną nazwę nadawcy (maksymalnie 100 znaków).");
  if (!email) throw new Error("Podaj poprawny adres e-mail nadawcy.");
  const senders = await getSenders();
  if (senders.length >= 20) throw new Error("Możesz zapisać maksymalnie 20 nadawców.");
  if (senders.some((sender) => sender.email === email)) throw new Error("Ten adres jest już na liście nadawców.");
  const updated = [...senders, { id: randomUUID(), name, email, isDefault: false }];
  await writeSenders(updated);
  return updated;
}

export async function updateSender(id: unknown, nameValue: unknown, emailValue: unknown): Promise<MailSender[]> {
  if (typeof id !== "string") throw new Error("Nieprawidłowy nadawca.");
  const name = normalizeName(nameValue);
  const email = normalizeEmail(emailValue);
  if (!name) throw new Error("Podaj poprawną nazwę nadawcy (maksymalnie 100 znaków).");
  if (!email) throw new Error("Podaj poprawny adres e-mail nadawcy.");
  const senders = await getSenders();
  if (!senders.some((sender) => sender.id === id)) throw new Error("Nie znaleziono nadawcy.");
  if (senders.some((sender) => sender.id !== id && sender.email === email)) throw new Error("Ten adres jest już na liście nadawców.");
  const updated = senders.map((sender) => sender.id === id ? { ...sender, name, email } : sender);
  await writeSenders(updated);
  return updated;
}

export async function setDefaultSender(id: unknown): Promise<MailSender[]> {
  if (typeof id !== "string") throw new Error("Nieprawidłowy nadawca.");
  const senders = await getSenders();
  if (!senders.some((sender) => sender.id === id)) throw new Error("Nie znaleziono nadawcy.");
  const updated = senders.map((sender) => ({ ...sender, isDefault: sender.id === id }));
  await writeSenders(updated);
  return updated;
}

export async function deleteSender(id: unknown): Promise<MailSender[]> {
  if (typeof id !== "string") throw new Error("Nieprawidłowy nadawca.");
  const senders = await getSenders();
  if (senders.length === 1) throw new Error("Na liście musi pozostać co najmniej jeden nadawca.");
  const removed = senders.find((sender) => sender.id === id);
  if (!removed) throw new Error("Nie znaleziono nadawcy.");
  const remaining = senders.filter((sender) => sender.id !== id);
  const updated = removed.isDefault ? remaining.map((sender, index) => ({ ...sender, isDefault: index === 0 })) : remaining;
  await writeSenders(updated);
  return updated;
}

export function formatSender(sender: MailSender): string {
  return `${sender.name} <${sender.email}>`;
}
