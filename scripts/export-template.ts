import { mkdirSync, writeFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OfferEmail } from "../src/emails/offer-email";

const html = renderToStaticMarkup(React.createElement(OfferEmail, {
  bodyHtml: "{{body}}", signatureHtml: "{{signature}}", subject: "{{subject}}", templateLabel: "{{label}}",
}));
mkdirSync("public/templates", { recursive: true });
writeFileSync("public/templates/cc-consulting.html", html.replace(/></g, ">\n<") + "\n");
