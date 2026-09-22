export type ConversationArchiveEntry = {
  archivedAt: string;
  latestInboundAt: string;
};

export type ArchiveState = {
  schemaVersion: 1;
  sent: Record<string, string>;
  conversations: Record<string, ConversationArchiveEntry>;
};

export const emptyArchiveState = (): ArchiveState => ({
  schemaVersion: 1,
  sent: {},
  conversations: {},
});

const validDate = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

export function parseArchiveState(value: unknown): ArchiveState {
  if (!value || typeof value !== "object") return emptyArchiveState();
  const input = value as Partial<ArchiveState>;
  const sent: Record<string, string> = {};
  const conversations: Record<string, ConversationArchiveEntry> = {};

  if (input.sent && typeof input.sent === "object") {
    for (const [id, archivedAt] of Object.entries(input.sent)) {
      if (/^[0-9a-f-]{36}$/i.test(id) && validDate(archivedAt)) sent[id] = archivedAt;
    }
  }

  if (input.conversations && typeof input.conversations === "object") {
    for (const [id, entry] of Object.entries(input.conversations)) {
      if (!/^[a-zA-Z0-9_-]{1,180}$/.test(id) || !entry || typeof entry !== "object") continue;
      const candidate = entry as Partial<ConversationArchiveEntry>;
      if (validDate(candidate.archivedAt) && validDate(candidate.latestInboundAt)) {
        conversations[id] = { archivedAt: candidate.archivedAt, latestInboundAt: candidate.latestInboundAt };
      }
    }
  }

  return { schemaVersion: 1, sent, conversations };
}

export function isConversationArchived(state: ArchiveState, id: string, latestInboundAt: string): boolean {
  const entry = state.conversations[id];
  if (!entry) return false;
  const archivedSnapshot = Date.parse(entry.latestInboundAt);
  const currentLatest = Date.parse(latestInboundAt);
  return Number.isFinite(archivedSnapshot) && Number.isFinite(currentLatest) && currentLatest <= archivedSnapshot;
}
