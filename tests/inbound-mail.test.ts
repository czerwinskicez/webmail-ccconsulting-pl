import assert from "node:assert/strict";
import test from "node:test";
import { parseInbound, replyDraft, replyHeaders, inboundDocument } from "../src/lib/inbound-mail";

const fixture = { schemaVersion: 1, direction: "inbound", from: { address: "author@example.com", name: "Autor" }, replyTo: [{ address: "reply@example.com" }], envelope: { to: "office@ccconsulting.pl" }, to: [{ address: "biuro@ccconsulting.pl" }], subject: "Re: Re: Współpraca", messageId: "<latest@example.com>", references: "<root@example.com>", text: "Treść", attachments: [{ filename: "CV.pdf", size: 532533, mimeType: "application/pdf" }] };
test("reply uses Reply-To, envelope recipient and single Re prefix", () => {
  const message = parseInbound(fixture, "key");
  const draft = replyDraft(message, [{ id: "biuro", email: "biuro@ccconsulting.pl", isDefault: true }, { id: "office", email: "office@ccconsulting.pl", isDefault: false }]);
  assert.equal(draft.senderId, "office");
  assert.equal(draft.to, "reply@example.com");
  assert.equal(draft.subject, "Re: Współpraca");
  assert.equal(message.attachments[0].filename, "CV.pdf");
  assert.deepEqual(replyHeaders(message), { "In-Reply-To": "<latest@example.com>", References: "<root@example.com> <latest@example.com>" });
});
test("reply falls back to From and default sender with explicit mismatch", () => {
  const message = parseInbound({ ...fixture, replyTo: [] }, "key");
  const draft = replyDraft(message, [{ id: "other", email: "other@example.com", isDefault: true }]);
  assert.equal(draft.to, "author@example.com");
  assert.equal(draft.senderMatched, false);
});
test("incoming HTML and text cannot execute scripts; header injection is filtered", () => {
  const message = parseInbound({ ...fixture, html: '<script>alert(1)</script><img src="https://example.com/tracker" onerror="alert(2)"><p>Hello</p>', messageId: "<valid@example.com>\r\nBcc: attacker@example.com" }, "key");
  const document = inboundDocument(message);
  assert.doesNotMatch(document, /<script|onerror/);
  assert.match(document, /default-src 'none'/);
  assert.match(document, /img-src 'none'/);
  assert.equal(replyHeaders(message)["In-Reply-To"], "<valid@example.com>");
  assert.match(inboundDocument({ ...message, html: "", text: "<script>bad</script>" }), /&lt;script&gt;/);
  assert.deepEqual(replyHeaders({ ...message, messageId: "invalid" }), {});
});
