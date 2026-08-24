# Canonical Solutions: Progress Report

## Snapshot

- Original spec: [`02-canonical-solutions.md`](./02-canonical-solutions.md)
- Working branch: `feature/canonical-solutions`
- Current commit: `a6d719b` (`Refine Peek confirmation UX`)
- Remote branch: `origin/feature/canonical-solutions`
- `main` is unchanged by this work.
- The feature is implemented as a static, in-memory browser feature. It adds no backend, account, API, or persistence mechanism.

This branch is a usable MVP and is deployed as a preview on the VPS. It is not merged to `main`. The intended workflow is to continue locally, push fixes to `feature/canonical-solutions`, and only merge and deploy `main` after review.

## What The Original Spec Asked For

The feature was intended to provide an optional storehouse of representative solutions and a review experience with three unlock paths:

1. Immediate permanent comparison after a passing run.
2. Permanent comparison after at least one failed run and five active minutes.
3. A one-time ten-second Peek before permanent unlock.

It was also required to remain independent of Points Mode, preserve the current editor and runtime behavior, avoid persistence, and support missing canonical solutions without showing dead UI.

## Requirements Matrix

| Area | Status | Current implementation |
| --- | --- | --- |
| Canonical source storehouse | Implemented, one source | `solutions/canonical/normal/binary_search.py` is checked in. Missing sources remain valid. |
| Automatic registry generation | Implemented | `generate-solutions.mjs` scans `normal` and `advanced`, validates drill IDs, and emits `web/src/generated/canonical-solutions.json`. |
| Build integration | Implemented | `dev`, `build`, and `generate:solutions` run the canonical generator. |
| Attempt adapter | Implemented | `App.tsx` supplies the stable `AttemptSessionView` contract with attempt identity, phase, elapsed time, failed runs, current source, passing snapshot, and `pointsEnabled: false`. |
| Pure reveal state machine | Implemented | `unavailable`, `locked`, `peek-active`, `peek-consumed`, `unlocked-pass`, and `unlocked-struggle` are modeled and unit tested. |
| PASS unlock | Implemented | A successful run unlocks comparison immediately. |
| Struggle unlock | Implemented | One or more failed runs plus `300` active seconds unlocks comparison. |
| One-time Peek | Implemented | Confirmation, ten-second expiry, early-close consumption, and no repeat are implemented. |
| Timer behavior during Peek | Implemented | The main rep timer pauses while comparison is open and resumes with the paused duration excluded. |
| Comparison modal | Implemented | Centered portal modal with Monaco `DiffEditor`, read-only panes, theme support, desktop side-by-side layout, and narrow-width fallback. |
| Clipboard protection | Implemented | Copy, cut, paste, and context-menu actions are blocked while the review modal is open. |
| Focus and Escape behavior | Mostly implemented | Focus trapping and Escape dismissal exist for both modals. Early close consumes Peek. Focus restoration is covered for explicit close, but expiry-specific restoration still needs a browser-level check. |
| No UI for missing sources | Implemented | `SolutionCoach` renders nothing when the selected drill has no registry entry. Currently only Exact binary search has a source, so only that drill exposes the controls. |
| Sidebar card from the original UX | Deliberately changed | The control moved from the crowded right panel to the editor header beside the drill title and timer, based on interactive review feedback. |
| Fallback progress display | Not implemented | The current UI unlocks at the threshold but does not show a five-minute progress indicator. |
| Unlock reason | Partial | The comparison says `Reference unlocked`, but does not yet show whether PASS or struggle time caused the unlock. |
| Full browser coverage | Blocked in VPS environment | The Playwright test exists but Chromium cannot launch on the VPS because `libatk-1.0.so.0` is missing. |

## Current User Experience

### Before an attempt

If a canonical source exists, the header control is present but disabled until the selected drill has started its attempt. If no source exists, there is no canonical control at all.

### Locked attempt

The compact header button reads `Peek at code`. Clicking it opens a centered confirmation dialog. The dialog explains:

- the sample template is visible for ten seconds;
- the rep timer pauses while the comparison is open;
- closing early still consumes the one-time Peek; and
- PASS or one failed run plus `05:00` of active practice unlocks permanent comparison.

The user can confirm with `Peek at code` or dismiss with `Keep practicing` or Escape. Dismissing the confirmation does not consume the Peek.

### Peek active

The comparison modal shows the user snapshot on the left and the reference on the right, with a visible `Peek ends in Ns` countdown. The main timer displays `Peek paused`. The review is view-only and clipboard operations are blocked.

Closing the comparison early consumes the Peek. Letting the ten seconds expire also consumes it and removes the comparison modal.

### Peek consumed

The original control remains in the same header position, changes to `Peek used`, and is disabled and grey. It cannot be reopened during that attempt.

### Permanent unlock

After PASS or the struggle threshold, the control reads `Show me a sample template`. It opens the same comparison modal without a countdown. After PASS, the left side uses the exact source snapshot captured at the successful run, not later edits made after passing. Before PASS, comparison uses the current source captured when the modal opens.

## Architecture And Data Flow

### Source registry

Canonical files use the exact drill slug:

```text
solutions/canonical/normal/<slug>.py
solutions/canonical/advanced/<slug>.py
```

`web/scripts/canonical-solutions-lib.mjs` validates mode names, rejects nested directories and unknown drill IDs, reads source text, sorts records, and allows an empty store. `generate-solutions.mjs` writes the generated JSON registry.

The generated registry is bundled into the static app. It is a UX gate, not a security boundary; downloaded assets can be inspected by a determined user.

### Attempt adapter

`App.tsx` derives the canonical session without changing the existing attempt record or local-storage model:

- attempt identity is `${drillId}:${startedAtMs}`;
- countdown is `armed`, an unfinished attempt is `active`, `running`, or `passed` depending on current state;
- every non-passing Run increments `failedRunCount`;
- `passingSource` is captured at the successful run;
- `pointsEnabled` is currently always `false`.

The timer pause bookkeeping lives in `App.tsx`, while reveal eligibility stays inside the canonical feature. This keeps the future Points Mode adapter free to replace internals while preserving the `AttemptSessionView` contract.

### Feature modules

```text
web/src/features/canonical/
  canonicalTypes.ts
  revealMachine.ts
  useRevealMachine.ts
  SolutionCoach.tsx
  SolutionComparison.tsx
  canonical.module.css
  revealMachine.test.ts
  SolutionCoach.test.tsx
```

`revealMachine.ts` is pure and owns eligibility transitions. The React hook owns the ten-second interval. `SolutionCoach` owns the trigger and unlock UX. `SolutionComparison` owns the portal, Monaco diff, focus trap, and clipboard blocking.

## Validation Completed

The following passed on the VPS at commit `a6d719b`:

```text
npm test       3 test files, 18 tests passed
npm run build  TypeScript checks and Vite production build passed
```

The production build emitted the canonical registry and the normal Vite bundles. The checked-in branding assets were also present in `web/dist/`.

The Playwright test was attempted with `npm run test:e2e`, but Chromium failed before the test started:

```text
error while loading shared libraries: libatk-1.0.so.0
```

This is an operating-system dependency problem in the VPS image, not an assertion failure. Run the browser test on a local machine with Chromium dependencies installed. The test currently covers the real Peek flow through expiry and the disabled `Peek used` state.

## Preview Deployment

The branch preview was deployed after the successful build by syncing `web/dist/` to the existing static root:

```text
/var/www/site/leetcode-template-gym
```

The last deployment returned `200 OK` through the local origin and through `https://gym.interviewprep.party`. Branding assets and the current bundle also returned successfully. No Nginx, Caddy, DNS, or Cloudflare configuration was changed for this feature. The existing VPS serving path remains in place.

The preview deployment is not the same thing as merging the branch. A later local fix must be built and explicitly deployed to the VPS if it needs to be previewed there.

## Known Gaps And Recommended Next Work

These are the most important remaining items before calling the original spec fully complete:

1. Add a visible fallback eligibility progress indicator that does not create a second competing timer.
2. Show the unlock reason, such as `Unlocked after PASS` or `Unlocked after 1 failed run and 05:00 practice`.
3. Add component tests for Escape in the confirmation dialog, early-close consumption, focus trapping, focus restoration after expiry, and preserving the passing snapshot after later editor edits.
4. Add browser coverage for immediate PASS unlock, responsive modal layout, and the no-canonical-source path. Run it on a machine with Playwright Chromium system libraries.
5. Consider a small `aria-live` announcement for the Peek countdown or its expiry. The current countdown is visually present but is not a dedicated live-region announcement.
6. Add more canonical files deliberately. The architecture supports all drills, but only `normal:binary_search` currently has a production reference.
7. Keep the canonical adapter contract stable when Points Mode is implemented. Points Mode must not make canonical unlocks depend on score, and canonical comparison must not create scoring events.

The right-panel wording from the original spec was intentionally superseded by the header placement requested during review. Revisit that only if the header becomes crowded after Points Mode adds its own controls.

## Local Pickup

From a local checkout:

```bash
git fetch origin
git switch --track origin/feature/canonical-solutions
cd web
npm ci
npm test
npm run build
npm run dev
```

If the branch already exists locally, use:

```bash
git switch feature/canonical-solutions
git pull --ff-only
```

After making and validating local fixes:

```bash
git add <files>
git commit -m "<message>"
git push origin feature/canonical-solutions
```

The VPS can then pick up the pushed branch explicitly:

```bash
git fetch origin
git switch feature/canonical-solutions
git pull --ff-only
cd web
npm ci
npm run build
```

Do not copy a local `dist` directory into production accidentally. The production site is served from the VPS web root above, not from this checkout's `web/dist/` directory. Deploy only after deliberately deciding to preview the branch or after merging to `main`.
