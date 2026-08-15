import type { ThemeName } from "../../types";

export type AttemptPhase = "idle" | "armed" | "active" | "running" | "passed";

export type AttemptSessionView = {
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

export type RevealState =
  | "unavailable"
  | "locked"
  | "peek-active"
  | "peek-consumed"
  | "unlocked-pass"
  | "unlocked-struggle";

export type RevealSnapshot = {
  attemptKey: string | null;
  state: RevealState;
  peekEndsAtMs: number | null;
};

export type SolutionCoachProps = {
  session: AttemptSessionView;
  canonicalSource: string | null;
  theme: ThemeName;
};

export function isPermanentReveal(state: RevealState): boolean {
  return state === "unlocked-pass" || state === "unlocked-struggle";
}
