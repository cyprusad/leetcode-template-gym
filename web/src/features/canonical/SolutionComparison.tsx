import { DiffEditor } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./canonical.module.css";

type SolutionComparisonProps = {
  originalSource: string;
  canonicalSource: string;
  theme: "dark" | "light";
  mode: "peek" | "permanent";
  remainingSeconds: number;
  onClose: () => void;
};

export function SolutionComparison({
  originalSource,
  canonicalSource,
  theme,
  mode,
  remainingSeconds,
  onClose
}: SolutionComparisonProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [isSideBySide, setIsSideBySide] = useState(() => window.innerWidth > 760);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const updateLayout = () => setIsSideBySide(window.innerWidth > 760);
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) {
        if ((event.ctrlKey || event.metaKey) && ["c", "x", "v"].includes(event.key.toLowerCase())) {
          event.preventDefault();
          event.stopPropagation();
        }
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

    function blockClipboard(event: ClipboardEvent) {
      event.preventDefault();
      event.stopPropagation();
    }

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("copy", blockClipboard, true);
    document.addEventListener("cut", blockClipboard, true);
    document.addEventListener("paste", blockClipboard, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("copy", blockClipboard, true);
      document.removeEventListener("cut", blockClipboard, true);
      document.removeEventListener("paste", blockClipboard, true);
      if (previousFocus && document.body.contains(previousFocus)) {
        previousFocus.focus();
      }
    };
  }, []);

  return createPortal(
    <div className={styles.backdrop} role="presentation">
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="canonical-comparison-title"
        aria-describedby="canonical-comparison-description"
      >
        <div className={styles.dialogHeader}>
          <div>
            <p className={styles.dialogEyebrow}>
              {mode === "peek" ? `Peek ends in ${remainingSeconds}s` : "Reference unlocked"}
            </p>
            <h2 id="canonical-comparison-title">Compare the pattern</h2>
            <p id="canonical-comparison-description" className={styles.dialogDescription}>
              Your attempt is on the left. The canonical pattern is on the right.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close canonical comparison"
          >
            Close
          </button>
        </div>
        <div className={styles.diffLabels} aria-hidden="true">
          <span>Your attempt</span>
          <span>Canonical pattern</span>
        </div>
        <p className={styles.clipboardNotice}>Reference code is view-only and cannot be copied during the review.</p>
        <div
          className={styles.diffSurface}
          onContextMenu={(event) => event.preventDefault()}
        >
          <DiffEditor
            original={originalSource}
            modified={canonicalSource}
            language="python"
            theme={`leetcode-gym-${theme}`}
            height="min(68vh, 720px)"
            options={{
              readOnly: true,
              domReadOnly: true,
              contextmenu: false,
              originalEditable: false,
              minimap: { enabled: false },
              automaticLayout: true,
              renderSideBySide: isSideBySide,
              scrollBeyondLastLine: false,
              fontSize: 13,
              fontFamily: '"JetBrains Mono", "SFMono-Regular", ui-monospace, monospace'
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
