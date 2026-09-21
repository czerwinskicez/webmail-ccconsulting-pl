import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken, matchesSecret, SESSION_SECONDS, verifySessionToken } from "../src/lib/session-token";

const secret = "test-only-secret-with-at-least-32-characters";
const now = 1_800_000_000_000;

test("accepts valid session and rejects incorrect or rotated secret", () => {
  const token = createSessionToken(secret, now);
  assert.ok(verifySessionToken(token, secret, now));
  assert.equal(verifySessionToken(token, "changed-secret", now), false);
  assert.equal(matchesSecret("wrong", secret), false);
  assert.ok(matchesSecret(secret, secret));
});

test("rejects expired, future, malformed and modified sessions", () => {
  const token = createSessionToken(secret, now);
  assert.equal(verifySessionToken(token, secret, now + SESSION_SECONDS * 1000), false);
  assert.equal(verifySessionToken(token, secret, now - 1000), false);
  for (const invalid of ["", "a.b.c", `${token}x`, token.replace(/^./, "9"), "x".repeat(300)]) {
    assert.equal(verifySessionToken(invalid, secret, now), false);
  }
});

test("session tokens are unique and contain no access secret", () => {
  const first = createSessionToken(secret, now);
  assert.notEqual(first, createSessionToken(secret, now));
  assert.equal(first.includes(secret), false);
});
