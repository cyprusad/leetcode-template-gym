import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCanonicalRegistry } from "./canonical-solutions-lib.mjs";

const __filename = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(__filename), "..");
const repoRoot = path.resolve(webRoot, "..");
const canonicalRoot = path.join(repoRoot, "solutions", "canonical");
const drillsPath = path.join(webRoot, "src", "generated", "drills.json");
const outputPath = path.join(webRoot, "src", "generated", "canonical-solutions.json");

const drills = JSON.parse(await readFile(drillsPath, "utf8"));
const registry = buildCanonicalRegistry({ canonicalRoot, drills });
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Generated ${registry.length} canonical solutions at ${path.relative(repoRoot, outputPath)}`);
