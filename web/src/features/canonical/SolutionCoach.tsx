import { useEffect, useRef, useState } from "react";
import type { SolutionCoachProps } from "./canonicalTypes";
import { isPermanentReveal } from "./canonicalTypes";
import { useRevealMachine } from "./useRevealMachine";
import { SolutionComparison } from "./SolutionComparison";
import styles from "./canonical.module.css";

export function SolutionCoach({ session, canonicalSource, theme, onPeekStateChange }: SolutionCoachProps) {
  const reveal = useRevealMachine(session, canonicalSource !== null);
  const [showPeekConfirmation, setShowPeekConfirmation] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [originalSource, setOriginalSource] = useState("");
  const peekButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousPeekActiveRef = useRef(false);

  useEffect(() => {
    if (reveal.state === "peek-consumed") {
      setIsComparisonOpen(false);
      setShowPeekConfirmation(false);
    }
  }, [reveal.state]);

  useEffect(() => {
    const isPeekActive = reveal.state === "peek-active";
    if (isPeekActive === previousPeekActiveRef.current) {
      return;
    }
    previousPeekActiveRef.current = isPeekActive;
    onPeekStateChange?.(isPeekActive);
  }, [onPeekStateChange, reveal.state]);

  if (canonicalSource === null || reveal.state === "unavailable") {
    return null;
  }

  const hasAttempt = session.attemptId !== null;
  const canPeek = hasAttempt && session.phase !== "idle" && session.phase !== "armed";
  const permanent = isPermanentReveal(reveal.state);

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
      <section className={`stats-card ${styles.card}`} aria-label="Show me a sample template">
        {reveal.state === "locked" ? (
          showPeekConfirmation ? (
            <div className={styles.confirmation} role="group" aria-label="Confirm Peek at code">
              <p className={styles.confirmationTitle}>Peek at the sample template for 10 seconds?</p>
              <p className={styles.confirmationCopy}>This uses your one-time Peek. The rep timer pauses while it is open. Closing early still consumes it. Otherwise, PASS or one failed run plus 05:00 of active practice unlocks this comparison permanently.</p>
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
              Peek at code
            </button>
          )
        ) : null}

        {permanent ? (
          <button type="button" className="accent-button" onClick={openPermanentComparison}>
            Show me a sample template
          </button>
        ) : null}

        {reveal.state === "peek-consumed" ? (
          <span className={styles.peekUsed}>Peek used</span>
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
