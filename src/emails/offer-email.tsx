import * as React from "react";

type OfferEmailProps = {
  bodyHtml: string;
  signatureHtml: string;
  subject: string;
};

export function OfferEmail({ bodyHtml, signatureHtml, subject }: OfferEmailProps) {
  return <html lang="pl">
    {/* This document is rendered by Resend as email HTML, outside the Next.js page tree. */}
    {/* eslint-disable-next-line @next/next/no-head-element */}
    <head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width" /><title>{subject}</title></head>
    <body style={{ margin: 0, padding: 0, backgroundColor: "#f5f5f5", fontFamily: "Arial, Helvetica, sans-serif", color: "#171717" }}>
      <div style={{ display: "none", maxHeight: 0, overflow: "hidden", opacity: 0 }}>{subject}</div>
      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: "#f5f5f5", padding: "28px 12px" }}>
        <tbody><tr><td align="center">
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ maxWidth: 640, backgroundColor: "#ffffff", border: "1px solid #e5e5e5", borderRadius: 10 }}>
            <tbody><tr><td style={{ padding: "36px 40px", fontSize: 15, lineHeight: 1.7 }}>
              <div className="email-content" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              {signatureHtml && <><div style={{ height: 1, backgroundColor: "#e8e8e8", margin: "30px 0 24px" }} /><div style={{ color: "#555555", fontSize: 13, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: signatureHtml }} /></>}
            </td></tr></tbody>
          </table>
        </td></tr></tbody>
      </table>
    </body>
  </html>;
}
