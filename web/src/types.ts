export type DrillMode = "normal" | "advanced";
export type ThemeName = "dark" | "light";

export type DrillManifestItem = {
  id: string;
  slug: string;
  title: string;
  mode: DrillMode;
  targetSeconds: number | null;
  source: string;
};

export type BucketAssignments = Record<string, DrillMode>;

export type DrillOrderState = {
  normal: string[];
  advanced: string[];
};

export type AttemptMetrics = {
  keystrokes: number;
  pasteCount: number;
  deleteCount: number;
  cursorMoveCount: number;
  selectionCount: number;
  runCount: number;
  terminalClearCount: number;
  printStatementCount: number;
};

export type AttemptRecord = {
  id: string;
  drillId: string;
  mode: DrillMode;
  startedAt: string;
  finishedAt: string;
  elapsedSeconds: number;
  passed: boolean;
  metrics: AttemptMetrics;
};

export type AttemptSnapshot = {
  metrics: AttemptMetrics;
  startedAtMs: number;
  finishedAtMs: number | null;
};

export type LayoutState = {
  leftPaneWidth: number;
  rightPaneWidth: number;
};
