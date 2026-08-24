import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SolutionCoachProps } from "./canonicalTypes";
import { isPermanentReveal } from "./canonicalTypes";
import { useRevealMachine } from "./useRevealMachine";
import { SolutionComparison } from "./SolutionComparison";
import styles from "./canonical.module.css";

type PeekConfirmationProps = {
  theme: "light" | "dark";
  onConfirm: () => void;
  onCancel: () => void;
};

function PeekConfirmation({ theme, onConfirm, onCancel }: PeekConfirmationProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    confirmButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) {
        return;
      }
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])"
        )
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      if (previousFocus && document.body.contains(previousFocus)) {
        previousFocus.focus();
      }
    };
  }, []);

  return createPortal(
    <div className={`${styles.backdrop} theme-${theme}`} role="presentation">
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${styles.confirmationDialog} theme-${theme}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="peek-confirmation-title"
        aria-describedby="peek-confirmation-description"
      >
        <p className={styles.dialogEyebrow}>One-time Peek</p>
        <h2 id="peek-confirmation-title">Peek at the sample template?</h2>
        <p id="peek-confirmation-description" className={styles.confirmationCopy}>
          This shows the sample template for 10 seconds. The rep timer pauses while it is open. Closing early still consumes it. Otherwise, PASS or one failed run plus 05:00 of active practice unlocks comparison permanently.
        </p>
        <div className={styles.confirmationActions}>
          <button ref={confirmButtonRef} type="button" className="accent-button" onClick={onConfirm}>
            Peek at code
          </button>
          <button type="button" className="secondary-button" onClick={onCancel}>
            Keep practicing
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

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
      <section className={styles.card} aria-label="Show me a sample template">
        {reveal.state === "locked" ? (
          <button
            ref={peekButtonRef}
            type="button"
            className="secondary-button"
            onClick={() => setShowPeekConfirmation(true)}
          >
            Peek at code
          </button>
        ) : reveal.state === "peek-consumed" ? (
          <button ref={peekButtonRef} type="button" className="secondary-button" disabled>
            Peek used
          </button>
        ) : null}

        {permanent ? (
          <button type="button" className="accent-button" onClick={openPermanentComparison}>
            Show me a sample template
          </button>
        ) : null}
      </section>

      {showPeekConfirmation ? (
        <PeekConfirmation
          theme={theme}
          onConfirm={confirmPeek}
          onCancel={() => setShowPeekConfirmation(false)}
        />
      ) : null}

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
