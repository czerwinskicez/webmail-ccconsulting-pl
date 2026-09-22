import assert from "node:assert/strict";
import test from "node:test";
import { buildConversations } from "../src/lib/conversations";
import { parseInbound } from "../src/lib/inbound-mail";
import type { SentMessage } from "../src/lib/sent-mail-store";

const incoming = (key: string, references = "", date = "2026-09-22T09:00:00Z") => parseInbound({ schemaVersion: 1, direction: "inbound", subject: "Ten sam temat", receivedAt: date, from: { address: "person@example.com" }, messageId: `<${key}@example.com>`, references }, key);
const sent = (key: string): SentMessage => ({ id: "sent", sentAt: "2026-09-22T10:00:00Z", from: "me@example.com", to: ["person@example.com"], cc: [], subject: "Re: Ten sam temat", bodyHtml: "", signatureHtml: "", resendIds: [], attachments: [], replyToKey: key });
test("matching subjects alone never join unrelated conversations", () => {
  assert.equal(buildConversations([incoming("a"), incoming("b")], []).length, 2);
});
test("stored reply marks conversation answered; a new incoming message reopens it", () => {
  assert.equal(buildConversations([incoming("a")], [sent("a")])[0].answered, true);
  const result = buildConversations([incoming("a"), incoming("b", "<a@example.com>", "2026-09-22T11:00:00Z")], [sent("a")]);
  assert.equal(result.length, 1);
  assert.equal(result[0].answered, false);
  assert.equal(result[0].incoming.length, 2);
  assert.equal(result[0].outgoing.length, 1);
});
test("replying to an older message does not mark latest incoming as answered", () => {
  const result = buildConversations([incoming("a"), incoming("b", "<a@example.com>", "2026-09-22T09:30:00Z")], [sent("a")]);
  assert.equal(result[0].answered, false);
});
test("siblings sharing a missing ancestor join; saved outgoing message ID joins first reply", () => {
  assert.equal(buildConversations([incoming("a", "<root@example.com>"), incoming("b", "<root@example.com>")], []).length, 1);
  const outgoing = { ...sent(""), replyToKey: undefined, emailMessageIds: ["<root@example.com>"] };
  assert.equal(buildConversations([incoming("a", "<root@example.com>")], [outgoing])[0].outgoing.length, 1);
});
