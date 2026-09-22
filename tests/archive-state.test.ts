import assert from "node:assert/strict";
import test from "node:test";
import { emptyArchiveState, isConversationArchived, parseArchiveState } from "../src/lib/archive-state";

test("a conversation remains archived while its latest inbound message is unchanged", () => {
  const state = emptyArchiveState();
  state.conversations.thread = {
    archivedAt: "2026-09-22T12:00:00Z",
    latestInboundAt: "2026-09-22T11:00:00Z",
  };
  assert.equal(isConversationArchived(state, "thread", "2026-09-22T11:00:00Z"), true);
});

test("a newer inbound message automatically returns an archived conversation to the active list", () => {
  const state = emptyArchiveState();
  state.conversations.thread = {
    archivedAt: "2026-09-22T12:00:00Z",
    latestInboundAt: "2026-09-22T11:00:00Z",
  };
  assert.equal(isConversationArchived(state, "thread", "2026-09-22T13:00:00Z"), false);
});

test("archive state ignores malformed records", () => {
  const state = parseArchiveState({
    sent: { "30e799be-b5ad-4730-95cc-63c787829284": "2026-09-22T12:00:00Z", invalid: "today" },
    conversations: { valid: { archivedAt: "2026-09-22T12:00:00Z", latestInboundAt: "2026-09-22T11:00:00Z" }, broken: {} },
  });
  assert.deepEqual(Object.keys(state.sent), ["30e799be-b5ad-4730-95cc-63c787829284"]);
  assert.deepEqual(Object.keys(state.conversations), ["valid"]);
});
