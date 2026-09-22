import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseInbound } from "../src/lib/inbound-mail";
import { buildReplyHistory, appendReplyHistory } from "../src/lib/reply-history";
import { OfferEmail } from "../src/emails/offer-email";

test("reply quotes original and its existing history after the new message", () => {
  const original = parseInbound({ schemaVersion: 1, direction: "inbound", from: { name: "Autor <test>", address: "author@example.com" }, html: '<p>Ostatnia odpowiedź</p><blockquote>Starsza wiadomość</blockquote><script>alert(1)</script><img src="https://example.com/tracker">', subject: "Temat" }, "key");
  const history = buildReplyHistory(original);
  assert.match(history, /Autor &lt;test&gt;/);
  assert.match(history, /Starsza wiadomość/);
  assert.doesNotMatch(history, /<script|<img/);
  const result = renderToStaticMarkup(React.createElement(OfferEmail, { bodyHtml: "<p>Moja odpowiedź</p>", signatureHtml: "<p>Podpis</p>", subject: "Re: Temat", replyHistoryHtml: history }));
  assert.ok(result.indexOf("Moja odpowiedź") < result.indexOf("Ostatnia odpowiedź"));
  assert.ok(result.indexOf("Podpis") < result.indexOf("Ostatnia odpowiedź"));
  const custom = appendReplyHistory("<html><body>Nowa treść</body></html>", history);
  assert.ok(custom.indexOf("Starsza wiadomość") < custom.indexOf("</body>"));
  assert.equal(appendReplyHistory("Bez historii", ""), "Bez historii");
});

test("plain text history is escaped and preserves line breaks", () => {
  const original = parseInbound({ schemaVersion: 1, direction: "inbound", text: "Tekst\n<script>nie kod</script>", from: { address: "a@example.com" } }, "key");
  const history = buildReplyHistory(original);
  assert.match(history, /white-space:pre-wrap/);
  assert.match(history, /&lt;script&gt;/);
});
