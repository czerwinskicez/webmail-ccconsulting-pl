import "server-only";
import { get, list } from "@vercel/blob";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { parseInbound } from "./inbound-mail";
import type { InboundMail } from "./inbound-mail";
import type { SentMessage } from "./sent-mail-store";
import { buildConversations } from "./conversations";

async function files(prefix: string) {
  const blobs = [];
  let cursor: string | undefined;
  do {
    const result = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...result.blobs.filter((item) => item.pathname.endsWith(".json")));
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);
  return blobs;
}
// Messages are immutable; including the upload date also invalidates overwritten files.
const read = unstable_cache(async (pathname: string, version: string) => {
  void version;
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) throw new Error("Nie udało się odczytać historii rozmów.");
  return JSON.parse(await new Response(result.stream).text());
}, ["conversation-message-v1"], { revalidate: 3600 });

export const getConversations = cache(async () => {
  const [receivedFiles, sentFiles] = await Promise.all([files("emails/inbound/"), files("sent/messages/")]);
  const all = [...receivedFiles, ...sentFiles];
  const incoming: InboundMail[] = [];
  const outgoing: SentMessage[] = [];
  let failed = 0;
  for (let start = 0; start < all.length; start += 8) {
    const batch = all.slice(start, start + 8);
    const results = await Promise.allSettled(batch.map(async (file) => {
      const value = await read(file.pathname, file.uploadedAt.toISOString());
      if (file.pathname.startsWith("emails/inbound/")) return { incoming: parseInbound(value, file.pathname.slice("emails/inbound/".length, -5)) };
      if (!value || typeof value.id !== "string" || typeof value.sentAt !== "string" || !Array.isArray(value.to)) throw new Error("Nieprawidłowe archiwum.");
      return { outgoing: value as SentMessage };
    }));
    for (const result of results) {
      if (result.status === "rejected") { failed++; continue; }
      if (result.value.incoming) incoming.push(result.value.incoming);
      if (result.value.outgoing) outgoing.push(result.value.outgoing);
    }
  }
  return { conversations: buildConversations(incoming, outgoing), failed };
});
