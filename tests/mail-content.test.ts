import assert from "node:assert/strict";
import test from "node:test";
import { hasMeaningfulContent, parseAddresses, sanitizeEmailHtml } from "../src/lib/mail-content";

test("parses, normalizes and deduplicates recipient addresses", () => {
  assert.deepEqual(parseAddresses("ONE@Example.com, two@example.com; one@example.com"), ["one@example.com", "two@example.com"]);
  assert.deepEqual(parseAddresses("invalid address"), []);
});

test("sanitizes editor HTML while keeping email formatting", () => {
  const result = sanitizeEmailHtml('<p style="text-align:center;color:red">Oferta</p><script>alert(1)</script><a href="javascript:alert(1)">link</a>');
  assert.match(result, /text-align:center/);
  assert.doesNotMatch(result, /script|javascript|color:red/);
  assert.ok(hasMeaningfulContent(result));
  assert.equal(hasMeaningfulContent("<p><br></p>"), false);
});
