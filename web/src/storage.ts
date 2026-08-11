import type {
  AttemptRecord,
  BucketAssignments,
  DrillManifestItem,
  LayoutState,
  DrillMode,
  DrillOrderState,
  ThemeName
} from "./types";

const ORDER_KEY = "leetcode-gym:web:order";
const ASSIGNMENT_KEY = "leetcode-gym:web:assignments";
const DRAFTS_KEY = "leetcode-gym:web:drafts";
const ATTEMPTS_KEY = "leetcode-gym:web:attempts";
const THEME_KEY = "leetcode-gym:web:theme";
const LAYOUT_KEY = "leetcode-gym:web:layout";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getInitialOrder(drills: DrillManifestItem[]): DrillOrderState {
  const fallback = {
    normal: drills.filter((drill) => drill.mode === "normal").map((drill) => drill.id),
    advanced: drills.filter((drill) => drill.mode === "advanced").map((drill) => drill.id)
  };
  const stored = readJson<DrillOrderState | null>(ORDER_KEY, null);
  if (!stored) {
    return fallback;
  }
  const validIds = new Set(drills.map((drill) => drill.id));
  const normalize = (ids: string[]) => ids.filter((id) => validIds.has(id));
  const storedNormal = normalize(stored.normal ?? []);
  const storedAdvanced = normalize(stored.advanced ?? []);
  const missing = fallback.normal
    .concat(fallback.advanced)
    .filter((id) => !storedNormal.includes(id) && !storedAdvanced.includes(id));
  return {
    normal: storedNormal.concat(missing.filter((id) => fallback.normal.includes(id))),
    advanced: storedAdvanced.concat(missing.filter((id) => fallback.advanced.includes(id)))
  };
}

export function saveOrder(order: DrillOrderState) {
  writeJson(ORDER_KEY, order);
}

export function getAssignments(drills: DrillManifestItem[]): BucketAssignments {
  const stored = readJson<BucketAssignments>(ASSIGNMENT_KEY, {});
  const validIds = new Set(drills.map((drill) => drill.id));
  return Object.fromEntries(
    Object.entries(stored).filter(([id, mode]) => validIds.has(id) && (mode === "normal" || mode === "advanced"))
  );
}

export function saveAssignments(assignments: BucketAssignments) {
  writeJson(ASSIGNMENT_KEY, assignments);
}

export function getDrafts(): Record<string, string> {
  return readJson<Record<string, string>>(DRAFTS_KEY, {});
}

export function saveDraft(drillId: string, source: string) {
  const drafts = getDrafts();
  drafts[drillId] = source;
  writeJson(DRAFTS_KEY, drafts);
}

export function getDraft(drillId: string): string | null {
  const drafts = getDrafts();
  return drafts[drillId] ?? null;
}

export function getAttempts(): AttemptRecord[] {
  return readJson<AttemptRecord[]>(ATTEMPTS_KEY, []);
}

export function saveAttempt(attempt: AttemptRecord) {
  const attempts = getAttempts();
  attempts.unshift(attempt);
  writeJson(ATTEMPTS_KEY, attempts.slice(0, 200));
}

export function getBestAttempt(drillId: string): AttemptRecord | null {
  return getAttempts()
    .filter((attempt) => attempt.drillId === drillId && attempt.passed)
    .sort((a, b) => a.elapsedSeconds - b.elapsedSeconds)[0] ?? null;
}

export function getLatestAttempts(limit = 12): AttemptRecord[] {
  return getAttempts().slice(0, limit);
}

export function deriveMode(
  drill: DrillManifestItem,
  assignments: BucketAssignments
): DrillMode {
  return assignments[drill.id] ?? drill.mode;
}

export function getTheme(): ThemeName {
  const theme = readJson<ThemeName | null>(THEME_KEY, null);
  return theme === "light" ? "light" : "dark";
}

export function saveTheme(theme: ThemeName) {
  writeJson(THEME_KEY, theme);
}

export function getLayout(): LayoutState {
  const layout = readJson<LayoutState | null>(LAYOUT_KEY, null);
  if (!layout) {
    return {
      leftPaneWidth: 380,
      rightPaneWidth: 360
    };
  }
  return {
    leftPaneWidth: Math.min(560, Math.max(360, layout.leftPaneWidth)),
    rightPaneWidth: Math.min(560, Math.max(280, layout.rightPaneWidth))
  };
}

export function saveLayout(layout: LayoutState) {
  writeJson(LAYOUT_KEY, layout);
}
