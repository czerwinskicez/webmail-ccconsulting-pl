import "server-only";
import { get, list } from "@vercel/blob";
import { parseInbound } from "./inbound-mail";

const PREFIX = "emails/inbound/";
export async function getInbound(key: string) {
  if (!/^[a-zA-Z0-9_-]{1,180}$/.test(key)) return null;
  const result = await get(`${PREFIX}${key}.json`, { access: "private", useCache: false });
  if (!result) return null;
  if (result.statusCode !== 200) throw new Error("Nie udało się odczytać wiadomości.");
  return parseInbound(JSON.parse(await new Response(result.stream).text()), key);
}
export async function listInbound(page: number) {
  const files: { pathname: string; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const result = await list({ prefix: PREFIX, cursor, limit: 1000 });
    files.push(...result.blobs.filter((blob) => /^emails\/inbound\/[a-zA-Z0-9_-]{1,180}\.json$/.test(blob.pathname)));
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);
  files.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime() || a.pathname.localeCompare(b.pathname));
  const pages = Math.max(1, Math.ceil(files.length / 25));
  const currentPage = Math.min(page, pages);
  const selected = files.slice((currentPage - 1) * 25, currentPage * 25);
  const messages = [];
  let failed = 0;
  for (let index = 0; index < selected.length; index += 5) {
    const results = await Promise.allSettled(selected.slice(index, index + 5).map((file) => getInbound(file.pathname.slice(PREFIX.length, -5))));
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) messages.push(result.value);
      else failed++;
    }
  }
  return { messages, failed, pages, currentPage, total: files.length };
}
