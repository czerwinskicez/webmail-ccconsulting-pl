import type { InboundMail } from "./inbound-mail";
import type { SentMessage } from "./sent-mail-store";

export type Conversation = { id: string; incoming: InboundMail[]; outgoing: SentMessage[]; latest: InboundMail; updatedAt: string; answered: boolean };
const ids = (value: string | undefined) => value?.match(/<[^<>\s]+@[^<>\s]+>/g) ?? [];
export const mailTime = (value: string) => Date.parse(value) || 0;
export function isAnswered(message: InboundMail, sent: SentMessage[]) {
  return sent.some((item) => item.replyToKey === message.key || (!!message.messageId && item.inReplyTo === message.messageId));
}

// Use actual mail headers rather than subjects, which are often reused by different people.
export function buildConversations(incoming: InboundMail[], outgoing: SentMessage[]): Conversation[] {
  const parents = new Map<string, string>();
  function root(id: string): string {
    if (!parents.has(id)) parents.set(id, id);
    const parent = parents.get(id)!;
    if (parent !== id) parents.set(id, root(parent));
    return parents.get(id)!;
  }
  function join(a: string, b: string) { parents.set(root(a), root(b)); }
  for (const message of incoming) {
    const node = `in:${message.key}`;
    root(node);
    for (const id of ids(`${message.messageId} ${message.inReplyTo} ${message.references}`)) join(node, `mid:${id}`);
  }
  for (const message of outgoing) {
    const node = `out:${message.id}`;
    root(node);
    if (message.replyToKey) join(node, `in:${message.replyToKey}`);
    for (const id of ids(`${message.inReplyTo || ""} ${message.references || ""} ${(message.emailMessageIds || []).join(" ")}`)) join(node, `mid:${id}`);
  }
  const groups = new Map<string, { incoming: InboundMail[]; outgoing: SentMessage[] }>();
  for (const message of incoming) {
    const key = root(`in:${message.key}`);
    const group = groups.get(key) ?? { incoming: [], outgoing: [] };
    group.incoming.push(message); groups.set(key, group);
  }
  for (const message of outgoing) groups.get(root(`out:${message.id}`))?.outgoing.push(message);
  return [...groups.values()].map((group) => {
    group.incoming.sort((a, b) => mailTime(a.receivedAt) - mailTime(b.receivedAt) || a.key.localeCompare(b.key));
    group.outgoing.sort((a, b) => mailTime(a.sentAt) - mailTime(b.sentAt));
    const latest = group.incoming[group.incoming.length - 1];
    const sentAt = group.outgoing.at(-1)?.sentAt;
    return { ...group, id: group.incoming[0].key, latest, updatedAt: sentAt && mailTime(sentAt) > mailTime(latest.receivedAt) ? sentAt : latest.receivedAt, answered: isAnswered(latest, group.outgoing) };
  }).sort((a, b) => mailTime(b.updatedAt) - mailTime(a.updatedAt));
}
