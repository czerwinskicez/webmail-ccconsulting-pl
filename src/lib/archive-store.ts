import "server-only";
import { get, put } from "@vercel/blob";
import { emptyArchiveState, parseArchiveState, type ArchiveState } from "./archive-state";

const ARCHIVE_PATH = "settings/archive-state.json";

export async function getArchiveState(): Promise<ArchiveState> {
  const result = await get(ARCHIVE_PATH, { access: "private", useCache: false });
  if (!result) return emptyArchiveState();
  if (result.statusCode !== 200) throw new Error("Nie udało się odczytać archiwum.");
  return parseArchiveState(JSON.parse(await new Response(result.stream).text()));
}

async function writeArchiveState(state: ArchiveState): Promise<void> {
  await put(ARCHIVE_PATH, JSON.stringify(state), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
    cacheControlMaxAge: 0,
  });
}

export async function setSentArchived(id: string, archived: boolean): Promise<ArchiveState> {
  const state = await getArchiveState();
  if (archived) state.sent[id] = new Date().toISOString();
  else delete state.sent[id];
  await writeArchiveState(state);
  return state;
}

export async function setConversationArchived(id: string, latestInboundAt: string, archived: boolean): Promise<ArchiveState> {
  const state = await getArchiveState();
  if (archived) state.conversations[id] = { archivedAt: new Date().toISOString(), latestInboundAt };
  else delete state.conversations[id];
  await writeArchiveState(state);
  return state;
}
