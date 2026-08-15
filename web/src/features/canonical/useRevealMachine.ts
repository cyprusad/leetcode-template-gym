import { useEffect, useMemo, useState } from "react";
import type { AttemptSessionView, RevealSnapshot } from "./canonicalTypes";
import {
  beginPeek as beginPeekTransition,
  consumePeek,
  createRevealSnapshot,
  peekRemainingSeconds,
  syncRevealSnapshot
} from "./revealMachine";

type RevealMachine = RevealSnapshot & {
  remainingSeconds: number;
  beginPeek: () => void;
  closePeek: () => void;
};

export function useRevealMachine(
  session: AttemptSessionView,
  canonicalAvailable: boolean
): RevealMachine {
  const [snapshot, setSnapshot] = useState(() =>
    createRevealSnapshot(canonicalAvailable, session.attemptId)
  );
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    setSnapshot((current) =>
      syncRevealSnapshot(current, session, canonicalAvailable, Date.now())
    );
  }, [
    canonicalAvailable,
    session.attemptId,
    session.elapsedSeconds,
    session.failedRunCount,
    session.phase
  ]);

  useEffect(() => {
    if (snapshot.state !== "peek-active") {
      return;
    }
    const interval = window.setInterval(() => {
      const nextNow = Date.now();
      setNowMs(nextNow);
      setSnapshot((current) =>
        syncRevealSnapshot(current, session, canonicalAvailable, nextNow)
      );
    }, 100);
    return () => window.clearInterval(interval);
  }, [
    canonicalAvailable,
    session.attemptId,
    session.elapsedSeconds,
    session.failedRunCount,
    session.phase,
    snapshot.state
  ]);

  const remainingSeconds = useMemo(
    () => peekRemainingSeconds(snapshot, nowMs),
    [nowMs, snapshot]
  );

  return {
    ...snapshot,
    remainingSeconds,
    beginPeek: () => {
      const startedAt = Date.now();
      setNowMs(startedAt);
      setSnapshot((current) => beginPeekTransition(current, session, startedAt));
    },
    closePeek: () => setSnapshot((current) => consumePeek(current))
  };
}
