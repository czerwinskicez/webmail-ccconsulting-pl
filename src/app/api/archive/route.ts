import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthorizedMutation } from "@/lib/request-auth";
import { getSentMessage } from "@/lib/sent-mail-store";
import { getConversations } from "@/lib/conversation-store";
import { setConversationArchived, setSentArchived } from "@/lib/archive-store";

export async function POST(request: Request) {
  if (!(await isAuthorizedMutation(request))) return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });

  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.id !== "string" || typeof body.archived !== "boolean") {
      return NextResponse.json({ error: "Nieprawidłowe dane archiwizacji." }, { status: 400 });
    }

    if (body.kind === "sent") {
      const message = await getSentMessage(body.id);
      if (!message) return NextResponse.json({ error: "Nie znaleziono wysłanej wiadomości." }, { status: 404 });
      await setSentArchived(message.id, body.archived);
      revalidatePath("/dashboard/wyslane");
      revalidatePath(`/dashboard/wyslane/${message.id}`);
      return NextResponse.json({ archived: body.archived });
    }

    if (body.kind === "conversation") {
      const { conversations, failed } = await getConversations();
      const conversation = conversations.find((item) => item.id === body.id);
      if (!conversation) {
        const message = failed ? "Nie udało się odczytać całej skrzynki. Spróbuj ponownie." : "Nie znaleziono rozmowy.";
        return NextResponse.json({ error: message }, { status: failed ? 503 : 404 });
      }
      await setConversationArchived(conversation.id, conversation.latest.receivedAt, body.archived);
      revalidatePath("/dashboard/odebrane");
      revalidatePath(`/dashboard/odebrane/${conversation.id}`);
      return NextResponse.json({ archived: body.archived });
    }

    return NextResponse.json({ error: "Nieprawidłowy rodzaj archiwum." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nie udało się zmienić archiwizacji." }, { status: 500 });
  }
}
