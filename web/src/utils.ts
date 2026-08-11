import type { DrillManifestItem, DrillMode, DrillOrderState } from "./types";

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function reorderList(items: string[], fromId: string, toId: string): string[] {
  if (fromId === toId) {
    return items;
  }
  const next = items.filter((item) => item !== fromId);
  const targetIndex = next.indexOf(toId);
  if (targetIndex === -1) {
    next.push(fromId);
    return next;
  }
  next.splice(targetIndex, 0, fromId);
  return next;
}

export function moveAcrossBuckets(
  order: DrillOrderState,
  _fromMode: DrillMode,
  toMode: DrillMode,
  drillId: string,
  beforeId?: string
): DrillOrderState {
  const next = {
    normal: order.normal.filter((id) => id !== drillId),
    advanced: order.advanced.filter((id) => id !== drillId)
  };
  const target = next[toMode];
  if (!beforeId) {
    target.push(drillId);
    return next;
  }
  const targetIndex = target.indexOf(beforeId);
  if (targetIndex === -1) {
    target.push(drillId);
  } else {
    target.splice(targetIndex, 0, drillId);
  }
  return next;
}

export function chooseRandomDrill(
  drills: DrillManifestItem[],
  order: DrillOrderState,
  mode: DrillMode
): DrillManifestItem | null {
  const ids = order[mode];
  if (ids.length === 0) {
    return null;
  }
  const byId = new Map(drills.map((drill) => [drill.id, drill]));
  const pool = ids.map((id) => byId.get(id)).filter(Boolean) as DrillManifestItem[];
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}
