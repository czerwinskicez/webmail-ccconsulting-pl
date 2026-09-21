import { del } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAuthorizedMutation } from "@/lib/request-auth";

const allowedContentTypes = [
  "application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain", "text/csv",
  "application/zip", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function POST(request: Request) {
  try {
    const body = await request.json() as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await isAuthorizedMutation(request))) throw new Error("Brak autoryzacji.");
        if (!pathname.startsWith("attachments/")) throw new Error("Nieprawidłowa ścieżka załącznika.");
        return { allowedContentTypes, maximumSizeInBytes: 20 * 1024 * 1024, addRandomSuffix: true };
      },
      onUploadCompleted: async () => undefined,
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nie udało się przesłać pliku." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthorizedMutation(request))) return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  try {
    const body = await request.json() as { urls?: unknown };
    const urls = Array.isArray(body.urls) ? body.urls.filter((value): value is string => typeof value === "string") : [];
    if (!urls.length || urls.some((url) => !url.includes("/attachments/"))) return NextResponse.json({ error: "Nieprawidłowe załączniki." }, { status: 400 });
    await del(urls);
    return NextResponse.json({ deleted: urls.length });
  } catch {
    return NextResponse.json({ error: "Nie udało się usunąć tymczasowych plików." }, { status: 500 });
  }
}
