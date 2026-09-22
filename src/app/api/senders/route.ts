import { NextResponse } from "next/server";
import { isAuthorizedMutation } from "@/lib/request-auth";
import { addSender, deleteSender, setDefaultSender, updateSender } from "@/lib/sender-store";

async function authorized(request: Request) {
  if (await isAuthorizedMutation(request)) return null;
  return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
}

function failure(error: unknown) {
  return NextResponse.json({ error: error instanceof Error ? error.message : "Nie udało się zapisać listy nadawców." }, { status: 400 });
}

export async function POST(request: Request) {
  const rejection = await authorized(request);
  if (rejection) return rejection;
  try {
    const body = await request.json() as Record<string, unknown>;
    return NextResponse.json({ senders: await addSender(body.name, body.email) });
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: Request) {
  const rejection = await authorized(request);
  if (rejection) return rejection;
  try {
    const body = await request.json() as Record<string, unknown>;
    return NextResponse.json({ senders: await updateSender(body.id, body.name, body.email) });
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(request: Request) {
  const rejection = await authorized(request);
  if (rejection) return rejection;
  try {
    const body = await request.json() as Record<string, unknown>;
    return NextResponse.json({ senders: await setDefaultSender(body.id) });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: Request) {
  const rejection = await authorized(request);
  if (rejection) return rejection;
  try {
    return NextResponse.json({ senders: await deleteSender(new URL(request.url).searchParams.get("id")) });
  } catch (error) {
    return failure(error);
  }
}
