import { NextResponse } from "next/server";
import { isAuthorizedMutation } from "@/lib/request-auth";
import { renderMailTemplate, validateTemplate } from "@/lib/mail-template";
import { appendReplyHistory } from "@/lib/reply-history";

export async function POST(request: Request) {
  if (!(await isAuthorizedMutation(request))) return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  try {
    const input = await request.json();
    const template = validateTemplate({ name: "Podgląd", html: input.html });
    for (const key of ["bodyHtml", "signatureHtml", "subject", "templateLabel"]) {
      if (typeof input[key] !== "string" || input[key].length > 100_000) throw new Error("Nieprawidłowe dane podglądu.");
    }
    const history = typeof input.replyHistoryHtml === "string" ? input.replyHistoryHtml : "";
    return NextResponse.json({ html: appendReplyHistory(renderMailTemplate(template.html, input), history) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nie udało się utworzyć podglądu." }, { status: 400 });
  }
}
