import "server-only";
import { get, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { type MailTemplate, validateTemplate } from "./mail-template";

const PATH = "settings/templates.json";

export async function getTemplates(): Promise<MailTemplate[]> {
  const result = await get(PATH, { access: "private", useCache: false });
  if (!result) return [];
  if (result.statusCode !== 200) throw new Error("Nie udało się odczytać szablonów.");
  const data: unknown = JSON.parse(await new Response(result.stream).text());
  if (!Array.isArray(data)) throw new Error("Nieprawidłowe dane szablonów.");
  return data.map((item) => {
    if (!item || typeof item.id !== "string") throw new Error("Nieprawidłowe dane szablonów.");
    return { id: item.id, ...validateTemplate(item) };
  });
}

export async function mutateTemplates(method: string, input: Record<string, unknown>) {
  const templates = await getTemplates();
  if (method !== "POST" && !templates.some((item) => item.id === input.id)) throw new Error("Nie znaleziono szablonu. Odśwież listę.");
  let updated: MailTemplate[];
  if (method === "DELETE") updated = templates.filter((item) => item.id !== input.id);
  else {
    const template = validateTemplate(input);
    if (method === "POST") {
      if (templates.length >= 20) throw new Error("Możesz zapisać maksymalnie 20 szablonów.");
      updated = [...templates, { id: randomUUID(), ...template }];
    } else updated = templates.map((item) => item.id === input.id ? { ...item, ...template } : item);
  }
  await put(PATH, JSON.stringify(updated), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 0 });
  return updated;
}
