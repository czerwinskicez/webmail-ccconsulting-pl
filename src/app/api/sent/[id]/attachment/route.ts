import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getSentMessage } from "@/lib/sent-mail-store";

type AttachmentRouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: AttachmentRouteProps) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  const { id } = await params;
  const pathname = new URL(request.url).searchParams.get("pathname");
  const message = await getSentMessage(id);
  const attachment = message?.attachments.find((item) => item.pathname === pathname);
  if (!attachment) return NextResponse.json({ error: "Nie znaleziono załącznika." }, { status: 404 });
  const result = await get(attachment.pathname, { access: "private" });
  if (!result || result.statusCode !== 200) return NextResponse.json({ error: "Nie znaleziono pliku." }, { status: 404 });
  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": attachment.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
