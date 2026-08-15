import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildCanonicalRegistry } from "./canonical-solutions-lib.mjs";

const temporaryRoots = [];

async function createCanonicalRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "canonical-solutions-"));
  await mkdir(path.join(root, "normal"));
  await mkdir(path.join(root, "advanced"));
  temporaryRoots.push(root);
  return root;
}

const drills = [
  { id: "normal:binary_search" },
  { id: "advanced:dp_1d" }
];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("buildCanonicalRegistry", () => {
  it("accepts an empty store", async () => {
    const canonicalRoot = await createCanonicalRoot();
    expect(buildCanonicalRegistry({ canonicalRoot, drills })).toEqual([]);
  });

  it("maps known solutions and sorts by drill id", async () => {
    const canonicalRoot = await createCanonicalRoot();
    await writeFile(path.join(canonicalRoot, "advanced", "dp_1d.py"), "advanced");
    await writeFile(path.join(canonicalRoot, "normal", "binary_search.py"), "normal");
    expect(buildCanonicalRegistry({ canonicalRoot, drills })).toEqual([
      { drillId: "advanced:dp_1d", source: "advanced" },
      { drillId: "normal:binary_search", source: "normal" }
    ]);
  });

  it("rejects a solution with no matching drill", async () => {
    const canonicalRoot = await createCanonicalRoot();
    await writeFile(path.join(canonicalRoot, "normal", "missing.py"), "source");
    expect(() => buildCanonicalRegistry({ canonicalRoot, drills })).toThrow(
      "Canonical solution does not match a drill: normal:missing"
    );
  });

  it("rejects nested solution directories", async () => {
    const canonicalRoot = await createCanonicalRoot();
    await mkdir(path.join(canonicalRoot, "normal", "nested"));
    expect(() => buildCanonicalRegistry({ canonicalRoot, drills })).toThrow(
      "Canonical solution directories are not supported"
    );
  });
  it("rejects unknown modes", async () => {
    const canonicalRoot = await createCanonicalRoot();
    await mkdir(path.join(canonicalRoot, "experimental"));
    expect(() => buildCanonicalRegistry({ canonicalRoot, drills })).toThrow(
      "Unknown canonical solution mode: experimental"
    );
  });
});
