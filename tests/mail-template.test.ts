import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderMailTemplate, validateTemplate } from "../src/lib/mail-template";

test("exported current template accepts all variables and preserves email layout", () => {
  const source = readFileSync("public/templates/cc-consulting.html", "utf8");
  const template = validateTemplate({ name: "CC Consulting", html: source });
  const html = renderMailTemplate(template.html, { bodyHtml: '<p>Treść <a href="https://example.com">link</a></p>', signatureHtml: "<p>Podpis</p>", subject: '<script>alert("x")</script>', templateLabel: "Kontakt & współpraca" });
  assert.match(html, /Treść/);
  assert.match(html, /Podpis/);
  assert.match(html, /Kontakt &amp; współpraca/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /color:#777772/);
  assert.match(html, /role="presentation"/);
  assert.match(html, /max-width:640px/);
  assert.doesNotMatch(html, /\{\{(?:body|signature|label|subject)\}\}/);
  assert.doesNotMatch(html, /<script/);
});

test("templates strip active content and forbid body placeholder in attributes", () => {
  assert.throws(() => validateTemplate({ name: "Test", html: '<div title="{{body}}">Test</div>' }), /Wstaw/);
  assert.throws(() => validateTemplate({ name: "Test", html: '{{body}}{{unknown}}' }), /Dostępne zmienne/);
  const { html } = validateTemplate({ name: "Test", html: '<script>alert(1)</script><form>Form</form><p onclick="alert(1)" style="background:url(https://example.com);color:#111">{{body}}</p>' });
  assert.doesNotMatch(html, /<script|<form|onclick|url\(/);
  assert.match(html, /color:#111/);
});

test("body and signature placeholders are replaced once and sanitized", () => {
  const html = renderMailTemplate('<div>{{body}}</div><div>{{signature}}</div>', { bodyHtml: '<p>{{signature}}</p><img src=x onerror=alert(1)>', signatureHtml: '<p>Podpis</p>', subject: "Temat", templateLabel: "Kontakt" });
  assert.equal(html, '<div><p>{{signature}}</p></div><div><p>Podpis</p></div>');
});

test("Georgia cold-mail template survives sanitization with email-safe table layout", () => {
  const source = readFileSync("templates/cold-mail-georgia.html", "utf8");
  const template = validateTemplate({ name: "Cold mail Georgia", html: source });
  const html = renderMailTemplate(template.html, { bodyHtml: "<p>Dzień dobry,</p>", signatureHtml: "<p>Podpis</p>", subject: "Kontakt", templateLabel: "" });
  assert.match(html, /role="presentation"/);
  assert.match(html, /width="600"/);
  assert.match(html, /max-width:600px/);
  assert.match(html, /font-family:Georgia/);
  assert.match(html, /cellpadding="0"/i);
  assert.match(html, /Dzień dobry/);
  assert.match(html, /Podpis/);
  assert.doesNotMatch(html, /<style|@media|<script/);
});
