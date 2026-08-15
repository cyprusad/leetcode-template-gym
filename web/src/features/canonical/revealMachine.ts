import type { AttemptSessionView, RevealSnapshot } from "./canonicalTypes";
import { isPermanentReveal } from "./canonicalTypes";

export const PEEK_DURATION_MS = 10_000;
export const STRUGGLE_UNLOCK_SECONDS = 300;

export function createRevealSnapshot(
  canonicalAvailable: boolean,
  attemptKey: string | null = null
): RevealSnapshot {
  return {
    attemptKey,
    state: canonicalAvailable ? "locked" : "unavailable",
    peekEndsAtMs: null
  };
}

export function syncRevealSnapshot(
  snapshot: RevealSnapshot,
  session: AttemptSessionView,
  canonicalAvailable: boolean,
  nowMs: number
): RevealSnapshot {
  if (!canonicalAvailable) {
    return createRevealSnapshot(false, session.attemptId);
  }

  const attemptChanged = snapshot.attemptKey !== session.attemptId;
  const base = attemptChanged
    ? createRevealSnapshot(true, session.attemptId)
    : snapshot;

  if (session.phase === "passed") {
    return {
      attemptKey: session.attemptId,
      state: "unlocked-pass",
      peekEndsAtMs: null
    };
  }

  if (session.failedRunCount > 0 && session.elapsedSeconds >= STRUGGLE_UNLOCK_SECONDS) {
    return {
      attemptKey: session.attemptId,
      state: "unlocked-struggle",
      peekEndsAtMs: null
    };
  }

  if (isPermanentReveal(base.state)) {
    return base;
  }

  if (base.state === "peek-active") {
    if (base.peekEndsAtMs !== null && nowMs >= base.peekEndsAtMs) {
      return {
        ...base,
        state: "peek-consumed",
        peekEndsAtMs: null
      };
    }
    return base;
  }

  return {
    ...base,
    state: base.state === "peek-consumed" ? "peek-consumed" : "locked",
    peekEndsAtMs: null
  };
}

export function beginPeek(
  snapshot: RevealSnapshot,
  session: AttemptSessionView,
  nowMs: number
): RevealSnapshot {
  if (
    snapshot.state !== "locked" ||
    snapshot.attemptKey !== session.attemptId ||
    session.attemptId === null ||
    session.phase === "idle" ||
    session.phase === "armed"
  ) {
    return snapshot;
  }
  return {
    ...snapshot,
    state: "peek-active",
    peekEndsAtMs: nowMs + PEEK_DURATION_MS
  };
}

export function consumePeek(snapshot: RevealSnapshot): RevealSnapshot {
  if (snapshot.state !== "peek-active") {
    return snapshot;
  }
  return {
    ...snapshot,
    state: "peek-consumed",
    peekEndsAtMs: null
  };
}

export function peekRemainingSeconds(snapshot: RevealSnapshot, nowMs: number): number {
  if (snapshot.state !== "peek-active" || snapshot.peekEndsAtMs === null) {
    return 0;
  }
  return Math.max(0, Math.ceil((snapshot.peekEndsAtMs - nowMs) / 1000));
}
