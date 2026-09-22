import "server-only";
import { copy, del, get, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";

const INDEX_PATH = "sent/index.json";

export type SentAttachment = {
  filename: string;
  pathname: string;
  size: number;
  contentType: string;
};

export type SentMessage = {
  id: string;
  sentAt: string;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  templateLabel?: string;
  renderedHtml?: string;
  templateName?: string;
  replyToKey?: string;
  replyHistoryHtml?: string;
  inReplyTo?: string;
  references?: string;
  emailMessageIds?: string[];
  bodyHtml: string;
  signatureHtml: string;
  resendIds: string[];
  attachments: SentAttachment[];
};

export type SentMessageSummary = Pick<SentMessage, "id" | "sentAt" | "from" | "to" | "cc" | "subject"> & {
  attachmentCount: number;
};

type ArchiveAttachment = Omit<SentAttachment, "pathname"> & { temporaryPathname: string };

async function readJson<T>(pathname: string): Promise<T | null> {
  try {
    const result = await get(pathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return null;
    return JSON.parse(await new Response(result.stream).text()) as T;
  } catch {
    return null;
  }
}

export async function getSentMessages(): Promise<SentMessageSummary[]> {
  return (await readJson<SentMessageSummary[]>(INDEX_PATH)) ?? [];
}

export async function getSentMessage(id: string): Promise<SentMessage | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return readJson<SentMessage>(`sent/messages/${id}.json`);
}

export async function archiveSentMessage(input: Omit<SentMessage, "id" | "sentAt" | "attachments"> & { attachments: ArchiveAttachment[] }): Promise<SentMessage> {
  const id = randomUUID();
  const sentAt = new Date().toISOString();
  const copiedPaths: string[] = [];
  try {
    const attachments: SentAttachment[] = [];
    for (const attachment of input.attachments) {
      const safeName = attachment.filename.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-140) || "attachment";
      const pathname = `sent/attachments/${id}/${safeName}`;
      await copy(attachment.temporaryPathname, pathname, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: attachment.contentType,
        cacheControlMaxAge: 0,
      });
      copiedPaths.push(pathname);
      attachments.push({ filename: attachment.filename, pathname, size: attachment.size, contentType: attachment.contentType });
    }

    const message: SentMessage = { ...input, id, sentAt, attachments };
    await put(`sent/messages/${id}.json`, JSON.stringify(message), {
      access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json; charset=utf-8", cacheControlMaxAge: 0,
    });
    const currentIndex = await getSentMessages();
    const summary: SentMessageSummary = { id, sentAt, from: input.from, to: input.to, cc: input.cc, subject: input.subject, attachmentCount: attachments.length };
    await put(INDEX_PATH, JSON.stringify([summary, ...currentIndex].slice(0, 1000)), {
      access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json; charset=utf-8", cacheControlMaxAge: 0,
    });
    return message;
  } catch (error) {
    if (copiedPaths.length) await del(copiedPaths).catch(() => undefined);
    throw error;
  }
}
