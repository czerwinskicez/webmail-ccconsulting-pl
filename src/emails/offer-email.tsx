import * as React from "react";

type OfferEmailProps = {
  bodyHtml: string;
  signatureHtml: string;
  subject: string;
  templateLabel?: string;
  replyHistoryHtml?: string;
};

const pageStyle: React.CSSProperties = { margin: 0, padding: 0, width: "100%", backgroundColor: "#f2f2f0", color: "#151515" };

export function OfferEmail({ bodyHtml, signatureHtml, subject, templateLabel = "Propozycja współpracy", replyHistoryHtml }: OfferEmailProps) {
  return <html lang="pl">
    {/* This document is rendered by Resend as email HTML, outside the Next.js page tree. */}
    {/* eslint-disable-next-line @next/next/no-head-element */}
    <head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width" /><title>{subject}</title></head>
    <body style={pageStyle}>
      <OfferEmailContent bodyHtml={bodyHtml} signatureHtml={signatureHtml} subject={subject} templateLabel={templateLabel} replyHistoryHtml={replyHistoryHtml} includePreviewText />
    </body>
  </html>;
}

export function OfferEmailContent({ bodyHtml, signatureHtml, subject, templateLabel = "Propozycja współpracy", replyHistoryHtml, includePreviewText = false }: OfferEmailProps & { includePreviewText?: boolean }) {
  return <>
    {includePreviewText && <div style={{ display: "none", maxHeight: 0, overflow: "hidden", opacity: 0, color: "transparent", fontSize: 1, lineHeight: "1px" }}>{subject}</div>}
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} bgcolor="#f2f2f0" style={{ width: "100%", backgroundColor: "#f2f2f0", margin: 0, padding: 0 }}>
      <tbody><tr><td align="center" style={{ padding: "32px 16px" }}>
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} bgcolor="#ffffff" style={{ width: "100%", maxWidth: 640, backgroundColor: "#ffffff", borderCollapse: "collapse" }}>
          <tbody>
            <tr><td style={{ padding: "28px 32px", backgroundColor: "#151515", borderBottom: "4px solid #d8d8d4" }}>
              <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}><tbody><tr>
                <td valign="middle" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 25, lineHeight: "32px", color: "#ffffff" }}>CC Consulting</td>
                <td align="right" valign="middle" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 10, lineHeight: "16px", letterSpacing: "1.3px", textTransform: "uppercase", color: "#b8b8b4" }}>{templateLabel}</td>
              </tr></tbody></table>
            </td></tr>
            <tr><td style={{ padding: "34px 32px 8px", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 16, lineHeight: "26px", color: "#151515", wordBreak: "break-word" }}>
              <div className="email-message-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            </td></tr>
            {signatureHtml && <tr><td style={{ padding: "6px 32px 34px" }}>
              <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ width: "100%" }}><tbody><tr><td style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 13, lineHeight: "21px", color: "#555551" }}>
                <div dangerouslySetInnerHTML={{ __html: signatureHtml }} />
              </td></tr></tbody></table>
            </td></tr>}
            <tr><td style={{ padding: "21px 32px", borderTop: "1px solid #d8d8d4", backgroundColor: "#ffffff" }}>
              <p style={{ margin: 0, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12, lineHeight: "20px", color: "#777773" }}>
                <span style={{ color: "#151515" }}>CC Consulting</span>
                <span style={{ color: "#b0b0ac" }}> &nbsp;·&nbsp; </span>
                <a href="tel:+48666555610" style={{ color: "#555551", textDecoration: "underline" }}>+48 666 555 610</a>
                <span style={{ color: "#b0b0ac" }}> &nbsp;·&nbsp; </span>
                <a href="https://ccconsulting.pl" style={{ color: "#555551", textDecoration: "underline" }} target="_blank" rel="noopener noreferrer">ccconsulting.pl</a>
              </p>
            </td></tr>
          </tbody>
        </table>
      </td></tr></tbody>
    </table>
    {replyHistoryHtml && <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ background: "#ffffff", color: "#555555" }}><tbody><tr><td style={{ padding: 24, fontFamily: "Arial,Helvetica,sans-serif" }}><div dangerouslySetInnerHTML={{ __html: replyHistoryHtml }} /></td></tr></tbody></table>}
  </>;
}
