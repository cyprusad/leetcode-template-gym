import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const MODES = ["normal", "advanced"];

export function buildCanonicalRegistry({ canonicalRoot, drills }) {
  const knownDrills = new Map(drills.map((drill) => [drill.id, drill]));
  const entries = [];
  const seen = new Set();

  let rootEntries;
  try {
    rootEntries = readdirSync(canonicalRoot, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return entries;
    }
    throw error;
  }
  for (const entry of rootEntries) {
    if (entry.isDirectory() && !MODES.includes(entry.name)) {
      throw new Error(`Unknown canonical solution mode: ${entry.name}`);
    }
  }

  for (const mode of MODES) {
    const modeRoot = path.join(canonicalRoot, mode);
    let files;
    try {
      files = readdirSync(modeRoot, { withFileTypes: true });
    } catch (error) {
      if (error?.code === "ENOENT") {
        continue;
      }
      throw error;
    }

    for (const entry of files) {
      if (entry.isDirectory()) {
        throw new Error(`Canonical solution directories are not supported: ${path.join(mode, entry.name)}`);
      }
      if (!entry.name.endsWith(".py")) {
        continue;
      }
      const slug = path.basename(entry.name, ".py");
      const drillId = `${mode}:${slug}`;
      if (seen.has(drillId)) {
        throw new Error(`Duplicate canonical solution: ${drillId}`);
      }
      if (!knownDrills.has(drillId)) {
        throw new Error(`Canonical solution does not match a drill: ${drillId}`);
      }
      const filePath = path.join(modeRoot, entry.name);
      if (!statSync(filePath).isFile()) {
        throw new Error(`Canonical solution is not a file: ${filePath}`);
      }
      seen.add(drillId);
      entries.push({ drillId, source: readFileSync(filePath, "utf8") });
    }
  }

  return entries.sort((a, b) => a.drillId.localeCompare(b.drillId));
}
