import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync, statSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..");
const drillsRoot = path.join(repoRoot, "gym", "drills");
const outputPath = path.join(webRoot, "src", "generated", "drills.json");

function walkFiles(dir) {
  return readdirSync(dir)
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry);
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        return walkFiles(fullPath);
      }
      return fullPath.endsWith(".py") ? [fullPath] : [];
    })
    .sort((a, b) => a.localeCompare(b));
}

function parseTitle(source, fallbackName) {
  const docstringMatch = source.match(/^\s*"""([^"\n]+)"/);
  if (!docstringMatch) {
    return fallbackName;
  }
  const firstLine = docstringMatch[1].trim();
  const drillMatch = firstLine.match(/^DRILL:\s*(.+?)(?:\.\s*Target:|$)/);
  return drillMatch?.[1]?.trim() || fallbackName;
}

function parseTargetSeconds(source) {
  const match = source.match(/Target:\s*<=\s*(\d+)\s*(seconds?|minutes?)/i);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  return unit.startsWith("minute") ? value * 60 : value;
}

const manifest = walkFiles(drillsRoot).map((filePath) => {
  const source = readFileSync(filePath, "utf8");
  const mode = path.basename(path.dirname(filePath));
  const slug = path.basename(filePath, ".py");
  return {
    id: `${mode}:${slug}`,
    slug,
    title: parseTitle(source, slug),
    mode,
    targetSeconds: parseTargetSeconds(source),
    source
  };
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Generated ${manifest.length} drills at ${path.relative(repoRoot, outputPath)}`);
