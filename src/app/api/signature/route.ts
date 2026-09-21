import { NextResponse } from "next/server";
import { isAuthorizedMutation } from "@/lib/request-auth";
import { saveSignature } from "@/lib/signature-store";

export async function POST(request: Request) {
  if (!(await isAuthorizedMutation(request))) return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  try {
    const body = await request.json() as { html?: unknown };
    const signature = await saveSignature(typeof body.html === "string" ? body.html : "");
    return NextResponse.json({ signature });
  } catch {
    return NextResponse.json({ error: "Nie udało się zapisać podpisu. Sprawdź połączenie z Vercel Blob." }, { status: 500 });
  }
}
