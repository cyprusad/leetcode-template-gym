import Editor from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ComponentProps } from "react";
import drills from "./generated/drills.json";
import { TerminalPane } from "./components/TerminalPane";
import { runPythonSource } from "./pyodide";
import {
  deriveMode,
  getLayout,
  getAssignments,
  getBestAttempt,
  getDraft,
  getInitialOrder,
  getLatestAttempts,
  getTheme,
  saveLayout,
  saveAssignments,
  saveAttempt,
  saveDraft,
  saveOrder,
  saveTheme
} from "./storage";
import type {
  AttemptMetrics,
  AttemptRecord,
  AttemptSnapshot,
  DrillManifestItem,
  LayoutState,
  DrillMode,
  DrillOrderState,
  ThemeName
} from "./types";
import { chooseRandomDrill, formatDuration, moveAcrossBuckets, reorderList } from "./utils";

const manifest = drills as DrillManifestItem[];
type EditorMount = NonNullable<ComponentProps<typeof Editor>["onMount"]>;
const RESIZER_WIDTH = 12;

const themes: Record<
  ThemeName,
  {
    editorTheme: "leetcode-gym-dark" | "leetcode-gym-light";
    terminalTheme: { background: string; foreground: string; cursor: string };
  }
> = {
  dark: {
    editorTheme: "leetcode-gym-dark",
    terminalTheme: {
      background: "#11111b",
      foreground: "#cdd6f4",
      cursor: "#89b4fa"
    }
  },
  light: {
    editorTheme: "leetcode-gym-light",
    terminalTheme: {
      background: "#ffffff",
      foreground: "#0f172a",
      cursor: "#2563eb"
    }
  }
};

const emptyMetrics = (): AttemptMetrics => ({
  keystrokes: 0,
  pasteCount: 0,
  deleteCount: 0,
  cursorMoveCount: 0,
  selectionCount: 0,
  runCount: 0,
  terminalClearCount: 0,
  printStatementCount: 0
});

function App() {
  const [assignments, setAssignments] = useState(() => getAssignments(manifest));
  const [order, setOrder] = useState<DrillOrderState>(() => getInitialOrder(manifest));
  const [theme, setTheme] = useState<ThemeName>(() => getTheme());
  const [layout, setLayout] = useState<LayoutState>(() => getLayout());
  const [activeMode, setActiveMode] = useState<DrillMode>("normal");
  const [selectedDrillId, setSelectedDrillId] = useState<string>(order.normal[0] ?? order.advanced[0] ?? "");
  const [editorValue, setEditorValue] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [attempt, setAttempt] = useState<AttemptSnapshot | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState("Pick a drill or choose a random one to start a timed rep.\n");
  const [isRunning, setIsRunning] = useState(false);
  const [latestAttempt, setLatestAttempt] = useState<AttemptRecord | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<AttemptRecord[]>(() => getLatestAttempts());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const editorRef = useRef<Parameters<EditorMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<EditorMount>[1] | null>(null);
  const themeConfig = themes[theme];

  const drillsById = useMemo(
    () => new Map(manifest.map((drill) => [drill.id, drill])),
    []
  );

  const selectedDrill = selectedDrillId ? drillsById.get(selectedDrillId) ?? null : null;
  const selectedMode = selectedDrill ? deriveMode(selectedDrill, assignments) : activeMode;
  const selectedBest = selectedDrill ? getBestAttempt(selectedDrill.id) : null;

  useEffect(() => {
    if (!selectedDrill) {
      return;
    }
    const saved = getDraft(selectedDrill.id);
    setEditorValue(saved ?? selectedDrill.source);
  }, [selectedDrill]);

  useEffect(() => {
    if (countdown === null) {
      return;
    }
    if (countdown === 0) {
      const startedAtMs = Date.now();
      setAttempt({
        metrics: emptyMetrics(),
        startedAtMs,
        finishedAtMs: null
      });
      setTimerSeconds(0);
      setCountdown(null);
      setTerminalOutput(`Starting ${selectedDrill?.title ?? "drill"}...\n`);
      return;
    }
    const timeout = window.setTimeout(() => {
      setCountdown((value) => (value === null ? null : value - 1));
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [countdown, selectedDrill]);

  useEffect(() => {
    if (!attempt || attempt.finishedAtMs) {
      return;
    }
    const interval = window.setInterval(() => {
      setTimerSeconds(Math.floor((Date.now() - attempt.startedAtMs) / 1000));
    }, 250);
    return () => window.clearInterval(interval);
  }, [attempt]);

  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveLayout(layout);
  }, [layout]);

  useEffect(() => {
    if (!monacoRef.current) {
      return;
    }
    monacoRef.current.editor.setTheme(themeConfig.editorTheme);
  }, [themeConfig.editorTheme]);

  function startSelection(drillId: string) {
    const drill = drillsById.get(drillId);
    if (!drill) {
      return;
    }
    setSelectedDrillId(drillId);
    setActiveMode(deriveMode(drill, assignments));
    setLatestAttempt(null);
    setAttempt(null);
    setTimerSeconds(0);
    setCountdown(3);
    setTerminalOutput(`Queued ${drill.title}. Countdown will start the rep.\n`);
  }

  function handleEditorChange(value: string | undefined) {
    const nextValue = value ?? "";
    setEditorValue(nextValue);
    if (selectedDrill) {
      saveDraft(selectedDrill.id, nextValue);
    }
  }

  function startResize(side: "left" | "right", startX: number) {
    const initial = layout;
    const onMove = (event: PointerEvent) => {
      const delta = event.clientX - startX;
      setLayout(() => {
        if (side === "left") {
          return {
            ...initial,
            leftPaneWidth: Math.min(560, Math.max(360, initial.leftPaneWidth + delta))
          };
        }
        return {
          ...initial,
          rightPaneWidth: Math.min(560, Math.max(280, initial.rightPaneWidth - delta))
        };
      });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.classList.remove("is-resizing");
    };
    document.body.classList.add("is-resizing");
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function handleRun() {
    if (!selectedDrill || !attempt || attempt.finishedAtMs || isRunning) {
      return;
    }
    const nextMetrics = {
      ...attempt.metrics,
      runCount: attempt.metrics.runCount + 1
    };
    setAttempt({ ...attempt, metrics: nextMetrics });
    setIsRunning(true);
    setTerminalOutput((current) => `${current}\n$ python ${selectedDrill.slug}.py\n`);
    void runPythonSource(editorValue).then((result) => {
      setIsRunning(false);
      setTerminalOutput((current) => {
        const chunks = [current];
        if (result.output) {
          chunks.push(result.output.endsWith("\n") ? result.output : `${result.output}\n`);
        }
        if (result.error) {
          chunks.push(result.error.endsWith("\n") ? result.error : `${result.error}\n`);
        }
        return chunks.join("");
      });

      const completedMetrics = {
        ...nextMetrics,
        printStatementCount: result.printStatementCount
      };
      const passed = result.ok && /(^|\n)PASS(\n|$)/.test(result.output);
      if (!passed) {
        setAttempt((currentAttempt) =>
          currentAttempt ? { ...currentAttempt, metrics: completedMetrics } : currentAttempt
        );
        return;
      }

      const finishedAtMs = Date.now();
      const elapsedSeconds = Math.max(1, Math.round((finishedAtMs - attempt.startedAtMs) / 1000));
      const record: AttemptRecord = {
        id: `${selectedDrill.id}:${finishedAtMs}`,
        drillId: selectedDrill.id,
        mode: selectedMode,
        startedAt: new Date(attempt.startedAtMs).toISOString(),
        finishedAt: new Date(finishedAtMs).toISOString(),
        elapsedSeconds,
        passed: true,
        metrics: completedMetrics
      };
      setAttempt({
        metrics: completedMetrics,
        startedAtMs: attempt.startedAtMs,
        finishedAtMs
      });
      setTimerSeconds(elapsedSeconds);
      setLatestAttempt(record);
      saveAttempt(record);
      setRecentAttempts(getLatestAttempts());
    });
  }

  function handleClearTerminal() {
    setTerminalOutput("");
    setAttempt((current) =>
      current
        ? {
            ...current,
            metrics: {
              ...current.metrics,
              terminalClearCount: current.metrics.terminalClearCount + 1
            }
          }
        : current
    );
  }

  function defineMonacoThemes(monaco: Parameters<EditorMount>[1]) {
    monaco.editor.defineTheme("leetcode-gym-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6C7086", fontStyle: "italic" },
        { token: "keyword", foreground: "CBA6F7" },
        { token: "string", foreground: "A6E3A1" },
        { token: "number", foreground: "FAB387" },
        { token: "type.identifier", foreground: "89B4FA" }
      ],
      colors: {
        "editor.background": "#11111B",
        "editor.foreground": "#CDD6F4",
        "editorLineNumber.foreground": "#6C7086",
        "editorLineNumber.activeForeground": "#BAC2DE",
        "editorCursor.foreground": "#89B4FA",
        "editor.selectionBackground": "#45475A",
        "editor.inactiveSelectionBackground": "#313244",
        "editorIndentGuide.background1": "#313244",
        "editorIndentGuide.activeBackground1": "#585B70"
      }
    });
    monaco.editor.defineTheme("leetcode-gym-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "64748B", fontStyle: "italic" },
        { token: "keyword", foreground: "1D4ED8" },
        { token: "string", foreground: "047857" },
        { token: "number", foreground: "B45309" },
        { token: "type.identifier", foreground: "0F172A" }
      ],
      colors: {
        "editor.background": "#FFFFFF",
        "editor.foreground": "#0F172A",
        "editorLineNumber.foreground": "#94A3B8",
        "editorLineNumber.activeForeground": "#334155",
        "editorCursor.foreground": "#2563EB",
        "editor.selectionBackground": "#DBEAFE",
        "editor.inactiveSelectionBackground": "#E2E8F0",
        "editorIndentGuide.background1": "#E2E8F0",
        "editorIndentGuide.activeBackground1": "#CBD5E1"
      }
    });
  }

  function onEditorMount(
    editor: Parameters<EditorMount>[0],
    monaco: Parameters<EditorMount>[1]
  ) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monaco.editor.setTheme(themeConfig.editorTheme);

    editor.onDidChangeModelContent((event) => {
      setAttempt((current) => {
        if (!current || current.finishedAtMs) {
          return current;
        }
        let keystrokes = current.metrics.keystrokes;
        let pasteCount = current.metrics.pasteCount;
        let deleteCount = current.metrics.deleteCount;
        for (const change of event.changes) {
          if (change.text.length > 0) {
            keystrokes += change.text.length;
            if (change.text.length > 1 || change.text.includes("\n")) {
              pasteCount += 1;
            }
          }
          if (change.rangeLength > 0 && change.text.length < change.rangeLength) {
            deleteCount += change.rangeLength - change.text.length;
          }
        }
        return {
          ...current,
          metrics: {
            ...current.metrics,
            keystrokes,
            pasteCount,
            deleteCount
          }
        };
      });
    });

    editor.onDidChangeCursorPosition(() => {
      setAttempt((current) =>
        current && !current.finishedAtMs
          ? {
              ...current,
              metrics: {
                ...current.metrics,
                cursorMoveCount: current.metrics.cursorMoveCount + 1
              }
            }
          : current
      );
    });

    editor.onDidChangeCursorSelection(() => {
      setAttempt((current) =>
        current && !current.finishedAtMs
          ? {
              ...current,
              metrics: {
                ...current.metrics,
                selectionCount: current.metrics.selectionCount + 1
              }
            }
          : current
      );
    });
  }

  function persistOrder(nextOrder: DrillOrderState, nextAssignments: typeof assignments) {
    setOrder(nextOrder);
    setAssignments(nextAssignments);
    saveOrder(nextOrder);
    saveAssignments(nextAssignments);
  }

  function handleDrop(targetMode: DrillMode, targetId?: string) {
    if (!draggingId) {
      return;
    }
    const drill = drillsById.get(draggingId);
    if (!drill) {
      return;
    }
    const fromMode = deriveMode(drill, assignments);
    let nextOrder = order;
    let nextAssignments = assignments;
    if (fromMode === targetMode) {
      nextOrder = {
        ...order,
        [targetMode]: reorderList(order[targetMode], draggingId, targetId ?? draggingId)
      };
    } else {
      nextAssignments = {
        ...assignments,
        [draggingId]: targetMode
      };
      nextOrder = moveAcrossBuckets(order, fromMode, targetMode, draggingId, targetId);
    }
    persistOrder(nextOrder, nextAssignments);
    setDraggingId(null);
  }

  function renderBucket(mode: DrillMode) {
    const ids = order[mode];
    return (
      <section
        className={`bucket bucket-${mode}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => handleDrop(mode)}
      >
        <div className="bucket-header">
          <h2>{mode === "normal" ? "Normal" : "Advanced"}</h2>
          <span>{ids.length} drills</span>
        </div>
        <div className="bucket-list">
          {ids.map((id) => {
            const drill = drillsById.get(id);
            if (!drill) {
              return null;
            }
            const isSelected = id === selectedDrillId;
            return (
              <button
                key={id}
                type="button"
                className={`drill-card${isSelected ? " selected" : ""}`}
                draggable
                onDragStart={() => setDraggingId(id)}
                onDragEnd={() => setDraggingId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(mode, id)}
                onClick={() => startSelection(id)}
              >
                <span className="drill-title">{drill.title}</span>
                <span className="drill-meta">
                  {drill.targetSeconds ? `<= ${formatDuration(drill.targetSeconds)}` : "untimed"}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div
      className={`app-shell theme-${theme}`}
      style={
        {
          "--left-pane-width": `${layout.leftPaneWidth}px`,
          "--right-pane-width": `${layout.rightPaneWidth}px`,
          "--resizer-width": `${RESIZER_WIDTH}px`
        } as CSSProperties
      }
    >
      <header className="topbar">
        <div>
          <p className="eyebrow">LeetCode Gym Web</p>
          <h1>Template reps in the browser</h1>
        </div>
        <div className="topbar-controls">
          <label className="theme-toggle" aria-label="Toggle dark mode">
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={(event) => setTheme(event.target.checked ? "dark" : "light")}
            />
            <span className="theme-toggle-track">
              <span className="theme-toggle-label theme-toggle-label-light">Light</span>
              <span className="theme-toggle-label theme-toggle-label-dark">Dark</span>
              <span className="theme-toggle-thumb" />
            </span>
          </label>
          <div className="mode-switch">
            <button
              type="button"
              className={activeMode === "normal" ? "active" : ""}
              onClick={() => setActiveMode("normal")}
            >
              Random normal
            </button>
            <button
              type="button"
              className={activeMode === "advanced" ? "active" : ""}
              onClick={() => setActiveMode("advanced")}
            >
              Random advanced
            </button>
          </div>
          <button
            type="button"
            className="accent-button"
            onClick={() => {
              const picked = chooseRandomDrill(manifest, order, activeMode);
              if (picked) {
                startSelection(picked.id);
              }
            }}
          >
            Pick random
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="panel templates-panel">
          <div className="panel-head">
            <h2>Templates</h2>
            <p>Drag to reorder or re-bucket.</p>
          </div>
          <div className="bucket-grid">
            {renderBucket("normal")}
            {renderBucket("advanced")}
          </div>
        </aside>

        <div
          className="pane-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize templates and editor"
          onPointerDown={(event) => startResize("left", event.clientX)}
        />

        <section className="panel editor-panel">
          <div className="panel-head">
            <div>
              <h2>{selectedDrill?.title ?? "Select a drill"}</h2>
              <p>
                {selectedDrill
                  ? `${selectedMode} drill${selectedDrill.targetSeconds ? ` • target ${formatDuration(selectedDrill.targetSeconds)}` : ""}`
                  : "The editor will load the chosen template source."}
              </p>
            </div>
            <div className="timer-cluster">
              {countdown !== null ? (
                <div className="countdown-badge">Starts in {countdown}</div>
              ) : (
                <div className={`timer-badge${attempt?.finishedAtMs ? " complete" : ""}`}>
                  {formatDuration(timerSeconds)}
                </div>
              )}
            </div>
          </div>
          <Editor
            height="100%"
            defaultLanguage="python"
            language="python"
            theme={themeConfig.editorTheme}
            beforeMount={defineMonacoThemes}
            value={editorValue}
            onChange={handleEditorChange}
            onMount={onEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: '"JetBrains Mono", "SFMono-Regular", ui-monospace, monospace',
              automaticLayout: true,
              scrollBeyondLastLine: false
            }}
          />
        </section>

        <div
          className="pane-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize editor and terminal"
          onPointerDown={(event) => startResize("right", event.clientX)}
        />

        <aside className="panel terminal-panel">
          <div className="panel-head terminal-head">
            <div>
              <h2>Terminal</h2>
              <p>Run the active file against its embedded asserts.</p>
            </div>
            <div className="terminal-actions">
              <button type="button" className="secondary-button" onClick={handleClearTerminal}>
                Clear
              </button>
              <button
                type="button"
                className="accent-button"
                onClick={handleRun}
                disabled={!attempt || !!attempt.finishedAtMs || isRunning}
              >
                {isRunning ? "Running..." : "Run"}
              </button>
            </div>
          </div>
          <div className="terminal-surface">
            <TerminalPane output={terminalOutput} theme={themeConfig.terminalTheme} />
          </div>
          <div className="stats-card">
            <h3>Attempt stats</h3>
            <dl>
              <div><dt>Keystrokes</dt><dd>{attempt?.metrics.keystrokes ?? 0}</dd></div>
              <div><dt>Pastes</dt><dd>{attempt?.metrics.pasteCount ?? 0}</dd></div>
              <div><dt>Deletes</dt><dd>{attempt?.metrics.deleteCount ?? 0}</dd></div>
              <div><dt>Cursor moves</dt><dd>{attempt?.metrics.cursorMoveCount ?? 0}</dd></div>
              <div><dt>Selections</dt><dd>{attempt?.metrics.selectionCount ?? 0}</dd></div>
              <div><dt>Runs</dt><dd>{attempt?.metrics.runCount ?? 0}</dd></div>
              <div><dt>Terminal clears</dt><dd>{attempt?.metrics.terminalClearCount ?? 0}</dd></div>
              <div><dt>Print calls</dt><dd>{attempt?.metrics.printStatementCount ?? 0}</dd></div>
            </dl>
          </div>
          <div className="stats-card">
            <h3>Pass summary</h3>
            {latestAttempt ? (
              <dl>
                <div><dt>Time</dt><dd>{formatDuration(latestAttempt.elapsedSeconds)}</dd></div>
                <div><dt>Drill</dt><dd>{selectedDrill?.title}</dd></div>
                <div><dt>Best</dt><dd>{selectedBest ? formatDuration(selectedBest.elapsedSeconds) : "First pass"}</dd></div>
              </dl>
            ) : (
              <p className="muted-copy">No passing run recorded in this view yet.</p>
            )}
          </div>
          <div className="stats-card">
            <h3>Recent passes</h3>
            <ul className="recent-list">
              {recentAttempts.length === 0 ? (
                <li className="muted-copy">Local history is empty.</li>
              ) : (
                recentAttempts.map((entry) => (
                  <li key={entry.id}>
                    <span>{drillsById.get(entry.drillId)?.title ?? entry.drillId}</span>
                    <strong>{formatDuration(entry.elapsedSeconds)}</strong>
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </main>

      <footer className="app-footer">
        <p>
          Made with {"<3"} and robots by{" "}
          <a href="https://x.com/cyprusad" target="_blank" rel="noreferrer">
            @cyprusad
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
