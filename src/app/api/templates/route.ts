import { NextResponse } from "next/server";
import { isAuthorizedMutation } from "@/lib/request-auth";
import { mutateTemplates } from "@/lib/template-store";

async function mutate(request: Request) {
  if (!(await isAuthorizedMutation(request))) return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  try {
    const input = await request.json();
    if (!input || typeof input !== "object") throw new Error("Nieprawidłowe dane.");
    return NextResponse.json({ templates: await mutateTemplates(request.method, input) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nie udało się zapisać szablonów." }, { status: 400 });
  }
}
export const POST = mutate;
export const PUT = mutate;
export const DELETE = mutate;
