import { describe, expect, it } from "vitest";
import type { AttemptSessionView } from "./canonicalTypes";
import {
  beginPeek,
  consumePeek,
  createRevealSnapshot,
  PEEK_DURATION_MS,
  syncRevealSnapshot
} from "./revealMachine";

function session(overrides: Partial<AttemptSessionView> = {}): AttemptSessionView {
  return {
    attemptId: "attempt-1",
    drillId: "normal:binary_search",
    phase: "active",
    startedAtMs: 0,
    elapsedSeconds: 0,
    failedRunCount: 0,
    currentSource: "user source",
    passingSource: null,
    pointsEnabled: false,
    ...overrides
  };
}

describe("canonical reveal machine", () => {
  it("starts locked and unavailable without a canonical source", () => {
    expect(createRevealSnapshot(true, "attempt-1").state).toBe("locked");
    expect(createRevealSnapshot(false, "attempt-1").state).toBe("unavailable");
  });

  it("requires an active attempt before Peek can start", () => {
    const snapshot = createRevealSnapshot(true, null);
    const next = beginPeek(snapshot, session({ attemptId: null, phase: "armed" }), 0);
    expect(next.state).toBe("locked");
  });

  it("consumes Peek after exactly ten seconds", () => {
    const armed = createRevealSnapshot(true, "attempt-1");
    const active = beginPeek(armed, session(), 1000);
    expect(active.state).toBe("peek-active");
    expect(active.peekEndsAtMs).toBe(1000 + PEEK_DURATION_MS);

    const expired = syncRevealSnapshot(active, session(), true, 1000 + PEEK_DURATION_MS);
    expect(expired.state).toBe("peek-consumed");
    expect(expired.peekEndsAtMs).toBeNull();
  });

  it("cannot reopen a consumed Peek", () => {
    const active = beginPeek(createRevealSnapshot(true, "attempt-1"), session(), 0);
    const consumed = consumePeek(active);
    expect(beginPeek(consumed, session(), 20_000)).toEqual(consumed);
  });

  it("unlocks after one failed run and five active minutes", () => {
    const snapshot = createRevealSnapshot(true, "attempt-1");
    const before = syncRevealSnapshot(
      snapshot,
      session({ failedRunCount: 1, elapsedSeconds: 299 }),
      true,
      0
    );
    expect(before.state).toBe("locked");

    const after = syncRevealSnapshot(
      before,
      session({ failedRunCount: 1, elapsedSeconds: 300 }),
      true,
      0
    );
    expect(after.state).toBe("unlocked-struggle");
  });

  it("unlocks immediately after PASS", () => {
    const snapshot = createRevealSnapshot(true, "attempt-1");
    const passed = syncRevealSnapshot(
      snapshot,
      session({ phase: "passed", passingSource: "passing source" }),
      true,
      0
    );
    expect(passed.state).toBe("unlocked-pass");
  });

  it("resets when the attempt changes", () => {
    const snapshot = beginPeek(createRevealSnapshot(true, "attempt-1"), session(), 0);
    const next = syncRevealSnapshot(
      snapshot,
      session({ attemptId: "attempt-2", elapsedSeconds: 300, failedRunCount: 0 }),
      true,
      1_000
    );
    expect(next.attemptKey).toBe("attempt-2");
    expect(next.state).toBe("locked");
  });
});
