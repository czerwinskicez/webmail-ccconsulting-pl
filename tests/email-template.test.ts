import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OfferEmail } from "../src/emails/offer-email";

test("renders a compatible table email without form or reply copy", () => {
  const html = renderToStaticMarkup(React.createElement(OfferEmail, {
    bodyHtml: "<p>Dzień dobry,</p><p>Treść wiadomości.</p>",
    signatureHtml: "<p><strong>Cezary Czerwiński</strong></p>",
    subject: "Porozmawiajmy o współpracy",
  }));
  assert.match(html, /role="presentation"/);
  assert.match(html, /Propozycja współpracy/i);
  assert.match(html, /ccconsulting\.pl/);
  assert.match(html, /\+48 666 555 610/);
  assert.match(html, /CC Consulting[\s\S]*\+48 666 555 610[\s\S]*ccconsulting\.pl/);
  assert.match(html, /color:#555551/);
  assert.match(html, /Porozmawiajmy o współpracy/);
  assert.doesNotMatch(html, /<h1/);
  assert.doesNotMatch(html, /border-top:1px solid #e8e8e5/);
  assert.doesNotMatch(html, /Odpowiedz na wiadomość|wysłana przez formularz/i);
});

test("renders a custom corner label", () => {
  const html = renderToStaticMarkup(React.createElement(OfferEmail, {
    bodyHtml: "<p>Treść</p>", signatureHtml: "", subject: "Temat", templateLabel: "Pierwszy kontakt",
  }));
  assert.match(html, /Pierwszy kontakt/);
  assert.doesNotMatch(html, /Propozycja współpracy/);
});
