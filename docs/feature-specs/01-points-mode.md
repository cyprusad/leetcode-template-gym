# Feature Spec 01: Points Mode and Rep Quality Telemetry

## Status and sequencing

- Status: planned.
- Recommended branch: `feature/points-mode`.
- Implement after Feature Spec 02 has merged.
- Preserve the canonical-solution feature and adapt it to the session model introduced here.
- This remains a static browser application. Completed attempts continue to use the existing browser-only localStorage history; no accounts, backend, or cross-device persistence are added.

## Goal

Turn the existing raw attempt counters into a transparent measure of rep quality. A clean, first-run solution typed from memory should score well. External pastes into TODO implementations, repeated corrections, failed runs, and execution errors should reduce the score. Pasting tests outside the implementation remains neutral, and additional passing assertions earn a small capped bonus.

Points Mode is enabled by default. A user may disable it before an attempt to retain raw metrics without score feedback.

## Attempt lifecycle

Replace the implicit countdown lifecycle with explicit phases:

```ts
type AttemptPhase = "idle" | "armed" | "active" | "running" | "passed";
```

- `idle`: normal saved-draft editing; no timer or score.
- `armed`: a clean starter template is loaded; the timer reads "Starts on first code edit."
- `active`: timer and telemetry are running.
- `running`: Python is executing while the rep timer continues.
- `passed`: score and metrics are finalized and no longer change.
- Selecting a drill must not start a countdown or attempt.
- Starting a scored rep with a modified saved draft requires confirmation, then resets the editor to the original drill source. Resuming the saved draft remains unscored.
- The first user edit intersecting a scored solution region starts the timer. Deleting starter `pass`, typing implementation code, or pasting into the implementation all qualify.
- Edits confined to setup or test code do not start the timer.
- Provide an explicit Start button for users who want to begin before typing.
- Bind `Ctrl/Cmd+Enter` to Start while armed and Run while active.
- Running while armed starts the timer immediately before execution.
- Lock the Points Mode toggle after an attempt becomes active.

Feature Spec 02 introduces an attempt-view adapter for canonical reveals. Replace its implementation with, but preserve the behavior of, this stable contract:

```ts
type AttemptSessionView = {
  attemptId: string | null;
  drillId: string | null;
  phase: AttemptPhase;
  startedAtMs: number | null;
  elapsedSeconds: number;
  failedRunCount: number;
  currentSource: string;
  passingSource: string | null;
  pointsEnabled: boolean;
};
```

## Solution-region metadata

Extend drill generation to identify every function or method body containing an initial `# TODO` and `pass`. This supports ordinary function drills and multi-method class drills such as Trie and DSU.

The generator must emit:

- Initial solution-body ranges.
- Every starter `pass` placeholder range in those bodies.
- Immutable starter source for assertion-integrity comparison.
- Starter top-level assertion count.

Use a tested indentation-aware parser in the Node generator:

- Find the nearest containing `def` for each TODO.
- Merge duplicate ranges for the same definition.
- Support multiple TODO methods in one class.
- Fail generation with filename and line information when a TODO cannot be mapped.
- Validate the parser against all current drills.

## Monaco telemetry and provenance

The current multi-character-change paste heuristic must be removed. It incorrectly labels autocomplete, undo, and programmatic edits as pastes.

Use these real event sources:

- Monaco `onDidType` for physical typed characters.
- Monaco `onDidChangeModelContent` for range transformations, removals, replacements, undo, and redo.
- Native `copy`, `cut`, and `paste` listeners on the Monaco DOM node for clipboard text and provenance.
- Monaco `onDidPaste` for the final pasted range.
- Monaco `onKeyDown` to correlate Backspace/Delete with resulting changes.

Maintain a pure document-provenance model that updates offsets after every content change:

```ts
type TextOrigin =
  | "starter"
  | "starter-pass"
  | "typed"
  | "external-paste"
  | "internal-paste";
```

Requirements:

- Starter `pass` characters retain their provenance even when deleted one character at a time.
- Removing only starter-pass text starts the timer but adds zero deletion operations and zero deleted characters.
- An internal paste requires an exact clipboard-text match copied or cut from the same editor during the current attempt.
- Clear internal clipboard provenance when the attempt or drill changes.
- A paste partially overlapping a solution region counts as a solution paste.
- A paste entirely outside solution regions is neutral.
- Programmatic model loads, autocomplete, formatting, undo, and redo are not pastes.

## Raw metrics schema

Version the metrics schema and normalize old localStorage records on read.

```ts
type AttemptMetricsV2 = {
  metricsVersion: 2;
  typedCharacters: number;
  pasteCount: number;
  externalSolutionPasteCount: number;
  internalSolutionPasteCount: number;
  neutralPasteCount: number;
  deletionOperations: number;
  deletedCharacters: number;
  undoCount: number;
  redoCount: number;
  cursorMoveCount: number;
  selectionCount: number;
  runCount: number;
  terminalClearCount: number;
  printStatementCount: number;
  solutionLineCount: number;
  starterAssertCount: number;
  customAssertCount: number;
  customAssertPassedCount: number;
  syntaxErrorCount: number;
  assertionErrorCount: number;
  runtimeErrorCount: number;
  timeoutCount: number;
};
```

Metric definitions:

- `typedCharacters` comes only from `onDidType`; pasted characters are excluded.
- One user content-change batch removing non-placeholder text is one deletion operation.
- `deletedCharacters` excludes starter-pass characters.
- Undo and redo are reported separately.
- Count a selection only when it is non-empty.
- `solutionLineCount` is the final number of nonblank, non-comment implementation lines inside TODO bodies, excluding unchanged TODO comments and standalone `pass`.
- Metrics update live and their completed values are saved in the existing local attempt history.

## Fixed score ledger

Start each scored attempt at zero. Store every score change as an immutable, timestamped ledger event.

```ts
type ScoreEvent = {
  id: string;
  atMs: number;
  kind: ScoreEventKind;
  delta: number;
  label: string;
};

type AttemptScore = {
  version: 1;
  total: number;
  events: ScoreEvent[];
};
```

Use these exact scoring rules:

| Event | Points | Cap |
|---|---:|---:|
| Passing the drill | `+100` | Once |
| Passing on the first run | `+25` | Once |
| Passing within target time | `+20` | Once |
| Passing within 1.5x target time | `+10` | Once, instead of `+20` |
| 0-2 corrected deletion operations | `+15` | Finalization only |
| 3-5 corrected deletion operations | `+10` | Finalization only |
| 6-10 corrected deletion operations | `+5` | Finalization only |
| Fast five-second typing interval | `+5` | Five intervals / `+25` |
| Unique custom assertion passed | `+3` | Five assertions / `+15` |
| External paste into a solution region | `-10` | Four events / `-40` |
| Internal copy/move into a solution region | `-2` | Five events / `-10` |
| Paste entirely outside solution regions | `0` | Unlimited |
| Syntax or indentation error | `-5` | Three events / `-15` |
| Assertion or logical failure | `-3` | Five events / `-15` |
| Other runtime exception | `-5` | Three events / `-15` |
| Execution timeout | `-10` | Two events / `-20` |
| Starter-test integrity violation | `-10` | Once |

A fast interval requires at least 15 physically typed solution characters during a fixed five-second active-attempt bucket. Do not count pasted text, typing outside solution regions, idle time, or partial buckets. Apply pass, pace, correction, and custom-test bonuses exactly once during finalization. The theoretical maximum is 200; scores may be negative before PASS.

## Assertions and test integrity

Pass both current and immutable starter source to the Python runner.

- Parse both with Python `ast`.
- Fingerprint starter top-level assertions using `ast.dump(..., include_attributes=False)`.
- Require all starter assertion fingerprints to remain present before a run can pass.
- Treat unique additional top-level assertions outside TODO definitions as custom tests.
- Ignore duplicate starter and custom assertions.
- Award custom-test points only on a successful final run.
- Keep this bonus capped because the system cannot judge semantic test quality.

## Pyodide worker and error classification

Move Pyodide execution into a dedicated Vite Web Worker. A Promise timeout around the current main-thread runner is insufficient because an infinite loop can freeze the event loop.

- Define typed `ready`, `run`, `result`, and `fatal` worker messages.
- Prewarm one worker when a drill is selected.
- Start the execution deadline only after Pyodide is ready.
- Use a three-second execution timeout.
- On timeout, terminate and recreate the worker before enabling another run.
- Preserve current stdout/stderr terminal behavior.

```ts
type RunOutcome =
  | "pass"
  | "syntax_error"
  | "assertion_error"
  | "runtime_error"
  | "timeout"
  | "missing_pass"
  | "test_integrity_error";

type RunPythonResult = {
  outcome: RunOutcome;
  ok: boolean;
  output: string;
  error?: string;
  exceptionType?: string;
  executionMs: number;
  printStatementCount: number;
  starterAssertCount: number;
  customAssertCount: number;
  customAssertPassedCount: number;
};
```

Classify `SyntaxError`, `IndentationError`, and `TabError` as syntax errors; `AssertionError` as assertion/logical failure; and other exceptions as runtime errors. Successful execution without an exact `PASS` line is a logical failure.

## Points feedback UX

Add a compact score card above Raw Stats in the right panel:

- Current total and attempt phase.
- Points Mode toggle while idle.
- Collapsible "Why this score?" ledger.
- Final quality summary after PASS.

Render up to four simultaneous feedback capsules in a layer anchored to the right panel:

- Positive events use green.
- Penalties use crimson.
- Neutral events use muted gray/orange.
- Animate upward and fade over roughly 2.2 seconds.
- Announce text through `aria-live="polite"`.
- Under `prefers-reduced-motion`, use a short fade without movement.

Example labels:

```text
-10 External paste in solution
-2 Moved code inside editor
+5 Fast typing: 3.4 chars/sec
+15 Clean corrections
```

Rename the existing Attempt Stats section to Raw Stats. Add solution LOC, custom assertions, corrected deletion operations, and error-category counts. The PASS summary must show the total and major reasons so raw metrics visibly explain rep quality.

## Testing

Add Vitest, React Testing Library, jsdom, and Playwright in a dedicated test-foundation commit if Feature Spec 02 has not already introduced them.

Unit coverage:

- Every score rule, cap, and idempotent finalization.
- Solution-region extraction across all current drills, especially Trie and DSU.
- Provenance transformations for typing, replacement, multiline edits, undo/redo, and partial `pass` deletion.
- Internal/external paste classification and overlap.
- LOC calculation and assertion comparison.
- Legacy localStorage normalization.
- Run-outcome metric and score updates.
- Five-second flow buckets with fake timers.

Playwright coverage against real Monaco:

- Selection, cursor movement, and test-only paste do not start the timer.
- Typing, deleting `pass`, and solution paste do start it.
- Deleting starter `pass` leaves deletion metrics at zero.
- External solution paste, internal copy/paste, and test paste produce `-10`, `-2`, and `0`.
- `Ctrl/Cmd+Enter` starts and then runs.
- Capsules, reduced motion, toggle locking, and final ledger render correctly.
- An actual infinite loop times out without freezing the page; the recreated worker can run a subsequent passing program.

Required validation:

```bash
cd web
npm test
npm run test:e2e
npm run build
```

## Acceptance criteria

- Existing drill order, bucket assignment, saved drafts, themes, Monaco behavior, terminal output, and local history remain compatible.
- No timer begins merely because a drill was selected.
- Starter `pass` deletion never pollutes deletion stats or score.
- Paste provenance is based on clipboard events, not text-length heuristics.
- Added tests outside TODO bodies are neutral to paste and receive a small bonus only after passing.
- Syntax, assertion, runtime, and timeout failures have separate raw counts.
- Infinite loops are recoverable without reloading the page.
- No backend, account, telemetry service, or cross-device persistence is introduced.
