import { useEffect, useRef, useState } from "react";
import type { SolutionCoachProps } from "./canonicalTypes";
import { isPermanentReveal } from "./canonicalTypes";
import { useRevealMachine } from "./useRevealMachine";
import { SolutionComparison } from "./SolutionComparison";
import styles from "./canonical.module.css";

function formatProgress(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function SolutionCoach({ session, canonicalSource, theme }: SolutionCoachProps) {
  const reveal = useRevealMachine(session, canonicalSource !== null);
  const [showPeekConfirmation, setShowPeekConfirmation] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [originalSource, setOriginalSource] = useState("");
  const peekButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (reveal.state === "peek-consumed") {
      setIsComparisonOpen(false);
      setShowPeekConfirmation(false);
    }
  }, [reveal.state]);

  if (canonicalSource === null || reveal.state === "unavailable") {
    return null;
  }

  const hasAttempt = session.attemptId !== null;
  const canPeek = hasAttempt && session.phase !== "idle" && session.phase !== "armed";
  const permanent = isPermanentReveal(reveal.state);
  const progress = Math.min(100, Math.round((session.elapsedSeconds / 300) * 100));

  function openPermanentComparison() {
    setOriginalSource(session.passingSource ?? session.currentSource);
    setIsComparisonOpen(true);
  }

  function confirmPeek() {
    reveal.beginPeek();
    setOriginalSource(session.passingSource ?? session.currentSource);
    setShowPeekConfirmation(false);
    setIsComparisonOpen(true);
  }

  function closeComparison() {
    setIsComparisonOpen(false);
    if (reveal.state === "peek-active") {
      reveal.closePeek();
      window.setTimeout(() => peekButtonRef.current?.focus(), 0);
    }
  }

  return (
    <>
      <section className={`stats-card ${styles.card}`}>
        <div className={styles.cardHeading}>
          <h3>Canonical pattern</h3>
          {permanent ? <span className={styles.unlockedBadge}>Unlocked</span> : null}
        </div>
        {reveal.state === "unlocked-pass" ? (
          <p className={styles.statusCopy} aria-live="polite">Passed. Compare your rep with the reference pattern.</p>
        ) : reveal.state === "unlocked-struggle" ? (
          <p className={styles.statusCopy} aria-live="polite">Practice window reached. Review the reference pattern.</p>
        ) : reveal.state === "peek-consumed" ? (
          <p className={styles.statusCopy} aria-live="polite">Your one-time peek has been used. Keep working from memory.</p>
        ) : (
          <>
            <p className={styles.statusCopy}>Pass, or make one run and practice for 05:00.</p>
            {session.failedRunCount > 0 ? (
              <div className={styles.progressGroup}>
                <div className={styles.progressLabel}>
                  <span>Practice progress</span>
                  <span>{formatProgress(Math.min(300, session.elapsedSeconds))} / 05:00</span>
                </div>
                <div className={styles.progressTrack} aria-label={`${progress}% practice progress`}>
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <p className={styles.mutedCopy}>Make a run to start the fallback unlock timer.</p>
            )}
          </>
        )}

        {reveal.state === "locked" ? (
          showPeekConfirmation ? (
            <div className={styles.confirmation}>
              <p>Use your one-time 10-second canonical peek?</p>
              <div className={styles.confirmationActions}>
                <button type="button" className="accent-button" onClick={confirmPeek}>
                  Use 10-second peek
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowPeekConfirmation(false)}
                >
                  Keep practicing
                </button>
              </div>
            </div>
          ) : (
            <button
              ref={peekButtonRef}
              type="button"
              className="secondary-button"
              disabled={!canPeek}
              onClick={() => setShowPeekConfirmation(true)}
            >
              Peek for 10 seconds
            </button>
          )
        ) : null}

        {permanent ? (
          <button type="button" className="accent-button" onClick={openPermanentComparison}>
            Compare solution
          </button>
        ) : null}

        {reveal.state === "peek-consumed" ? (
          <button
            ref={peekButtonRef}
            type="button"
            className="secondary-button"
            disabled
          >
            Peek used
          </button>
        ) : null}
      </section>

      {isComparisonOpen ? (
        <SolutionComparison
          originalSource={originalSource}
          canonicalSource={canonicalSource}
          theme={theme}
          mode={reveal.state === "peek-active" ? "peek" : "permanent"}
          remainingSeconds={reveal.remainingSeconds}
          onClose={closeComparison}
        />
      ) : null}
    </>
  );
}
