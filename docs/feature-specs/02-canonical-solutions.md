# Feature Spec 02: Canonical Pattern Store and Reveal UX

## Status and sequencing

- Status: ready to implement first.
- Recommended branch: `feature/canonical-solutions` created from current `main`.
- This feature must work independently of Points Mode.
- Keep implementation isolated under canonical-feature modules so Feature Spec 01 can later replace the attempt lifecycle without rewriting reveal behavior.
- This remains a static browser application. Reveal state is in memory only.

## Goal

Create an optional storehouse of canonical solutions and a comparison experience that unlocks:

- Immediately after the current attempt passes.
- After at least one failed run and five active attempt minutes.
- Once for ten seconds before permanent unlock, when the user explicitly consumes a Peek.

This task builds the architecture and UX. It does not need to author production canonical solutions for the current drills.

## Canonical source layout

Use this repository layout:

```text
solutions/canonical/
  README.md
  normal/
    <drill-slug>.py
  advanced/
    <drill-slug>.py
```

Each future canonical file is a full executable version of its drill:

- Preserve the drill docstring and starter harness.
- Preserve all starter assertions.
- Replace TODO/pass implementations with a concise canonical pattern.
- Additional explanatory comments are allowed.
- The implementation demonstrates a representative reusable pattern; it does not need to match every valid user algorithm.

Add contributor documentation explaining naming, structure, validation, and the fact that missing canonical files are valid.

## Generation and registry

Add `web/scripts/generate-solutions.mjs`, separate from the existing drill generator.

The script must:

- Scan `solutions/canonical/normal` and `solutions/canonical/advanced` when present.
- Map `<mode>/<slug>.py` to an existing generated drill ID.
- Reject unknown modes, unknown drill slugs, duplicate mappings, or unreadable files.
- Allow any or all drills to have no canonical source.
- Generate an empty registry when no production solutions exist.
- Write `web/src/generated/canonical-solutions.json`.
- Run after drill generation and before TypeScript/Vite compilation.

Registry shape:

```ts
type CanonicalSolutionRecord = {
  drillId: string;
  source: string;
};
```

The registry may be bundled with the static application. Reveal gates are pedagogical UX, not a security boundary; a determined user can inspect downloaded assets.

## Standalone attempt adapter

Create a small canonical-feature adapter that converts current App state into this structural view:

```ts
type AttemptPhase = "idle" | "armed" | "active" | "running" | "passed";

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

For the current pre-Points implementation:

- Derive `attemptId` from drill ID and attempt start time.
- Treat countdown as armed, an unfinished attempt as active/running, and `latestAttempt` as passed.
- Add an explicit in-memory `failedRunCount`, reset when a drill/attempt changes and increment for every non-passing Run result.
- Capture `passingSource` at the exact successful run before later editor edits can change it.
- Set `pointsEnabled` to `false`; the canonical feature must not depend on scoring.

Feature Spec 01 will later own the real session model but must preserve this view contract.

## Reveal state machine

Implement reveal eligibility as a pure, tested state machine:

```ts
type RevealState =
  | "unavailable"
  | "locked"
  | "peek-active"
  | "peek-consumed"
  | "unlocked-pass"
  | "unlocked-struggle";
```

Rules:

- `unavailable`: selected drill has no canonical registry entry; render no sidebar card.
- `locked`: an attempt is active but permanent conditions are unmet.
- `peek-active`: canonical comparison is visible with a ten-second countdown.
- `peek-consumed`: Peek ended and cannot be used again in this attempt.
- `unlocked-pass`: PASS unlocks comparison immediately and permanently for this attempt.
- `unlocked-struggle`: one or more failed runs plus 300 active seconds unlocks comparison permanently.
- Peek is available only after an attempt starts and before permanent unlock.
- Peek requires confirmation and is consumed when confirmed, even if the user closes it early.
- If PASS or struggle unlock occurs during Peek, transition directly to permanent unlock.
- Reset state for a new attempt or drill.
- Do not persist reveal state to localStorage or sessionStorage.

For this feature, a failed run is any completed Run action that does not pass. After Feature Spec 01 lands, syntax, assertion, runtime, timeout, missing-PASS, and test-integrity outcomes all count.

## Sidebar UX

Add a compact `Canonical pattern` card to the existing right panel:

- Before unlock, explain: `Pass, or make one run and practice for 05:00.`
- Show a one-time `Peek for 10 seconds` action after the attempt starts.
- During the five-minute fallback, show elapsed eligibility progress without adding a second timer.
- After unlock, show `Compare solution` and the unlock reason.
- Render nothing when no canonical source exists, avoiding dead controls while the store is empty.

The card must not alter attempt score or raw metrics.

## Comparison experience

Open comparison in a full-workspace modal or drawer rather than compressing the editor or terminal panel.

Use the existing `DiffEditor` from `@monaco-editor/react`:

- Left/original is the exact passing-source snapshot after PASS.
- Before PASS, left/original is a current-source snapshot captured when comparison opens.
- Right/modified is canonical source.
- Both sides are read-only.
- Labels are `Your attempt` and `Canonical pattern`.
- Use the current Monaco light/dark theme.
- Use side-by-side diff at desktop widths.
- Use inline diff or vertically stacked presentation at narrow widths.
- Preserve the main editor model, cursor, scroll position, draft, and attempt state.

Peek behavior:

- Show a visible ten-second countdown.
- Closing early consumes Peek.
- On expiry, unmount comparison and restore focus to the Peek trigger.
- If permanent unlock occurs while open, remove the countdown and leave comparison available.

Accessibility:

- Use dialog semantics with a visible title.
- Trap focus while open.
- Restore focus on close.
- Escape closes a permanent comparison.
- Escape may close Peek early but still consumes it.
- Announce Peek countdown and unlock changes without excessive live-region noise.
- Honor reduced-motion preferences.

## Component boundary

Keep the feature independently testable:

```ts
type SolutionCoachProps = {
  session: AttemptSessionView;
  canonicalSource: string | null;
  theme: ThemeName;
};
```

Recommended module ownership:

```text
web/src/features/canonical/
  canonicalTypes.ts
  revealMachine.ts
  SolutionCoach.tsx
  SolutionComparison.tsx
  canonical.module.css
  *.test.ts(x)
```

Limit edits outside that directory to:

- Build-script invocation for canonical generation.
- Generated registry import.
- Minimal App adapter/state wiring.
- One right-panel render location.

Do not modify Pyodide, Monaco editing options, storage, drill logic, or scoring.

## Testing foundation

If the repository still has no frontend test setup, add a separate first commit containing:

- Vitest.
- React Testing Library and `@testing-library/jest-dom`.
- jsdom.
- Playwright with Chromium.
- `test`, `test:watch`, and `test:e2e` package scripts.
- Shared Vitest and Playwright configuration.

Keep this commit behavior-free so Feature Spec 01 can reuse it later.

## Unit and component tests

Generator coverage:

- Empty canonical directories produce an empty valid registry.
- A known `<mode>/<slug>.py` maps to the expected drill ID.
- Unknown modes, unknown slugs, duplicates, and unreadable files fail clearly.
- Missing solutions are accepted.

Reveal-state coverage with fake timers:

- No run plus five minutes remains locked.
- One failed run before five minutes remains locked.
- One failed run plus five minutes unlocks.
- PASS unlocks immediately.
- Peek is unavailable before attempt start.
- Peek lasts exactly ten seconds.
- Peek cannot be repeated.
- Closing early consumes Peek.
- Permanent unlock during Peek cancels expiry and remains available.
- New drill or attempt resets reveal state.

Component coverage:

- No registry entry renders no card.
- Locked, Peek, PASS-unlocked, and struggle-unlocked cards show correct actions.
- PASS uses passing-source rather than later editor content.
- Struggle comparison snapshots current source when opened.
- Focus trap, Escape behavior, focus restoration, theme changes, and reduced motion work.
- Mock Monaco DiffEditor in jsdom tests.

Playwright coverage:

- Use fixture canonical content that is not emitted as a production drill solution.
- Verify the real right-panel card and modal layout.
- Verify ten-second Peek expiry and one-use behavior.
- Verify immediate PASS unlock through an injected/fake run result rather than depending on the Pyodide CDN.
- Verify responsive comparison at desktop and narrow viewport sizes.

Required validation:

```bash
cd web
npm test
npm run test:e2e
npm run build
```

## Acceptance criteria

- The production build succeeds with zero canonical solution files.
- Adding a correctly named canonical file requires no manual registry edit.
- A reference unlocks immediately after PASS.
- One failed run plus five active minutes unlocks it.
- Peek is available once for exactly ten seconds and is consumed even when closed early.
- The comparison is read-only, theme-aware, responsive, and accessible.
- Existing editor, terminal, drill, storage, and theme behavior remains unchanged.
- No canonical reveal state is persisted.
- No backend, account, API, or third-party dependency beyond test tooling is introduced.

## Handoff to Feature Spec 01

After this feature merges, create the Points Mode branch from updated `main`. Points Mode may replace the current attempt-state internals, but it must continue supplying `AttemptSessionView` to `SolutionCoach` and preserve these canonical-feature invariants:

- PASS and struggle unlock behavior does not depend on points.
- Canonical comparison does not generate score events.
- Missing canonical content remains a valid no-UI state.
- Passing-source snapshots remain stable after PASS.
- Canonical modules and tests remain independently runnable.
