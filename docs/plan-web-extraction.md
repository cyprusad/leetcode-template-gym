# Plan: Extract `web/` into Separate Closed-Source Codebase

**Date:** 2026-08-24
**Status:** Draft — awaiting approval before execution
**Author:** Muse Spark (analysis of `web/` @ `main:1d8751a`)
**Goal:** Keep `leetcode-template-gym` (root) MIT-open-source for CLI/drills, move `web/` to a private repo for closed-source iteration while preserving clean data flow.

---

## 1. Executive Summary

`web/` is a static Vite+React app that *appears* self-contained but has two hard build-time couplings to the parent repo:
- `gym/drills/**/*.py` → `web/src/generated/drills.json` via `web/scripts/generate-drills.mjs:10`
- `solutions/canonical/**/*.py` → `web/src/generated/canonical-solutions.json` via `web/scripts/generate-solutions.mjs:9`

All other couplings are soft (docs, ops). Extraction therefore requires vendoring or syncing the drill/canonical *data* into the new repo. Once copied, `web/` has **zero runtime dependencies** on the parent — no API, no DB, no env vars.

Recommended approach: **Phase 1 vendored snapshot** (copy `gym/drills/` + `solutions/canonical/` into `closed-repo/data/` and rewrite generators to `./data/...`), with an **optional Phase 2** `git subtree` sync if upstream drill contributions need to flow frequently.

---

## 2. Current Coupling Inventory

### 2.1 `web/` → Root (hard dependencies)

| File in `web/` | Reads from root | How | Frequency | Required? |
|---|---|---|---|---|
| `web/scripts/generate-drills.mjs:9-10` | `gym/drills/normal/*.py`, `gym/drills/advanced/*.py` | `path.resolve(webRoot,"..") + "/gym/drills"` → `walkFiles()` → `write src/generated/drills.json` | `dev` + `build` (`web/package.json:7-8`) | **Yes** — manifest is source of truth for `App.tsx:3` |
| `web/scripts/generate-solutions.mjs:9-10` | `solutions/canonical/normal/*.py`, `solutions/canonical/advanced/*.py` | `buildCanonicalRegistry({canonicalRoot, drills})` → `write src/generated/canonical-solutions.json` | `dev`+`build` after drills | **Yes** — powers `SolutionCoach.tsx` peek/compare |
| `web/scripts/canonical-solutions-lib.mjs:4-63` | same as above + `drills.json` for validation | Validates slug/mode, rejects unknown IDs | build-time | **Yes** (if canonicals used) |
| `web/public/brand/*` | *none* — vendored inside `web/` | — | — | No |
| `web/src/pyodide.ts`, `web/src/storage.ts` etc. | **no** root imports | Pure browser storage + Pyodide CDN | — | No |

**Result:** 100% of root coupling is *build-time data generation*. No runtime `gym.py:1` or `leetcode-gym:1` execution, no Python CLI, no shared utils.

### 2.2 Root → `web/` (reverse dependencies)

| Root artifact | References `web/` | Impact of removal |
|---|---|---|
| `README.md:40-57` “Web app” section | Points to `web/` + `web/README.md` | Docs broken unless patched |
| `docs/feature-specs/*.md` | Mention `web/src/...` paths | Historical, not required to keep |
| `.gitignore:21-26` `node_modules/`, `dist/` | Ignores `web/` build artifacts | No impact if `web/` removed — rules can stay |
| `LICENSE:1` MIT | Covers `web/` today; closed repo becomes separate copyright | Needs fork with attribution |

**No CI, no Makefile, no Docker at root** that builds `web/` automatically.

### 2.3 Full `web/` File Inventory (what to copy)

```
web/
├── package.json                    # deps: @monaco-editor/react, react, xterm, vite, vitest, playwright
├── package-lock.json
├── vite.config.ts:4                # host 0.0.0.0:4173, plugin react()
├── tsconfig*.json, vitest.config.ts, playwright.config.ts
├── index.html, public/{favicon, brand/*, site.webmanifest}
├── scripts/
│   ├── generate-drills.mjs         # reads ../gym/drills
│   ├── generate-solutions.mjs      # reads ../solutions/canonical
│   └── canonical-solutions-lib.mjs # pure validator
└── src/
    ├── App.tsx:3                   # imports ./generated/*.json
    ├── main.tsx, styles.css, types.ts, storage.ts, utils.ts, pyodide.ts
    ├── generated/                  # ephemeral — regenerated, can .gitignore in new repo
    ├── components/TerminalPane.tsx
    └── features/canonical/*        # 5 modules + tests
    └── ... tests, e2e/
```

Total ~60 modules transformed (`vite build`), bundle ~500kB.

---

## 3. Goals & Constraints

1. **Root stays MIT-open** (`LICENSE:1`) with `gym/drills/`, `gym.py`, `leetcode-gym`, `solutions/canonical/` (28 files) for community contributions.
2. **New repo is private/closed** — must not publish drills’ source as open if business decision, but MIT *permits* closed-source reuse with attribution (see §7).
3. **No tight coupling** — `closed-web` must build without cloning the OSS repo.
4. **Low maintenance** — drill additions should be easy to sync, not manual copy-paste each time.
5. **Preserve history** — keep `web/` commit history if possible.
6. **Ops continuity** — `web/dist/` → `/var/www/...` + Nginx + Cloudflare remains valid.

---

## 4. Options Analysis

| Option | Mechanism | Pros | Cons | Recommendation |
|---|---|---|---|---|
| **A. Vendored snapshot (copy)** | `cp -r gym/drills solutions/canonical → closed-repo/data/` + rewrite generators to `../data/...` | Simplest; closed repo fully self-contained; MIT attribution easy | Drill updates require manual sync | ✅ **Recommended Phase 1** |
| **B. Git submodule** | `closed-repo` adds `oss` as `git submodule @ f8cfb5c` at `vendor/leetcode-template-gym`; generators read `vendor/.../gym/drills` | Live sync to upstream SHA; no copy drift | Submodule DX pain; CI needs `--recursive`; private repo exposes submodule URL (still public) | Viable if sync > weekly |
| **C. Git subtree / split** | `git subtree split -P web -b web-only` to extract history then import into closed repo | Preserves `web/` commit history cleanly; no submodule | Extra tooling; drill data still not included (need A or B for drills) | Good for *initial import* of `web/` history, combine with A |
| **D. npm package / API** | Publish `@cyprusad/drills` from OSS, closed repo `npm install` | Versioned, semver | Over-engineered for 28 static files; publishing delay | Overkill now |
| **E. Monorepo with private remote** | Keep `web/` in same repo, add private mirror remote | Zero copy | Cannot make `web/` private without making all private | Reject — violates “web private / root open” requirement |

**Verdict:** Start with **A + C**: use `git subtree` to seed closed repo with `web/` history, then vendor `gym/drills` + `solutions/canonical` as `data/` for self-contained builds. Keep submodule as *optional* if sync burden grows.

---

## 5. Recommended Architecture

### 5.1 New Private Repo Layout

```
leetcode-gym-web-private/
├── README.md                       # private project readme + MIT attribution
├── LICENSE_PRIVATE                 # proprietary, plus “Portions © 2026 MIT …” notice
├── data/                           # vendored snapshot from OSS (Phase 1)
│   ├── drills/
│   │   ├── normal/   (25 .py)
│   │   └── advanced/ (3 .py)
│   └── canonical/
│       ├── normal/   (25 .py)
│       └── advanced/ (3 .py)
├── public/    (copied from web/public)
├── scripts/
│   ├── generate-drills.mjs   # patched: repoRoot → data/drills
│   ├── generate-solutions.mjs# patched: canonicalRoot → data/canonical
│   └── canonical-solutions-lib.mjs (unchanged)
├── src/       (verbatim from web/src)
├── index.html, package.json, vite.config.ts, tsconfig*.json, etc.
└── .github/workflows/ci.yml   # optional, runs npm test + build
```

### 5.2 Generator Patch (minimal)

`generate-drills.mjs:9`

```diff
- const repoRoot = path.resolve(webRoot, "..");
- const drillsRoot = path.join(repoRoot, "gym", "drills");
+ const dataRoot = path.join(webRoot, "data");
+ const drillsRoot = path.join(dataRoot, "drills");
```

`generate-solutions.mjs:8-9`

```diff
- const repoRoot = path.resolve(webRoot, "..");
- const canonicalRoot = path.join(repoRoot, "solutions", "canonical");
+ const dataRoot = path.join(webRoot, "data");
+ const canonicalRoot = path.join(dataRoot, "canonical");
```

`src/generated/` remains ephemeral; add to `.gitignore` in private repo if desired, but current `web/src/generated/*.json` is *tracked* (52-file fast-forward) — keep tracked initially for deterministic builds, then optionally ignore.

### 5.3 OSS Retention (root repo)

- Keep `gym/drills/`, `solutions/canonical/`, `gym.py`, `README.md`, `LICENSE` unchanged.
- **Strip `web/`** after confirmed parity: `git rm -r web/` + patch `README.md:40-57` to point to new private URL (or remove). Keep `docs/` canonical specs for historical reference.
- Tag `web-extraction@1d8751a` before removal for provenance.

---

## 6. Extraction Steps (Clean Plan)

### Phase 0 — Prep (no code change)

- [ ] Tag: `git tag web-extraction-base 1d8751a && git push origin web-extraction-base`
- [ ] Verify `main` is `npm run build` green (already: `dist/index.html 0.83kB`, 28 drills, 28 canonicals)
- [ ] Create empty private repo `github.com/cyprusad/leetcode-gym-web-private` (private, no template)

### Phase 1 — Seed Private Repo with History (preserves blame)

```bash
# from OSS root
git subtree split -P web -b web-extraction-temp
git push <private-remote> web-extraction-temp:main  # or fetch & merge

# in private repo
git log --oneline | head   # should show web-only commits back to 01-points-mode
ls -1                      # should be former web/ contents at root
```

*If history preservation not required, `cp -r web/* private-repo/` is acceptable.*

### Phase 2 — Vendor Data

```bash
# from private repo (still has web content at root)
mkdir -p data/drills data/canonical
cp -r ../leetcode-template-gym/gym/drills/* data/drills/
cp -r ../leetcode-template-gym/solutions/canonical/* data/canonical/
cp -r ../leetcode-template-gym/solutions/canonical/README.md data/canonical/README.md

# patch generators as in §5.2
# test
npm install
npm run build  # expects Generated 28 drills / 28 canonicals
npm test       # 22 tests
```

Commit: `feat: vendor OSS drills (28) at data/ @ 1d8751a`.

### Phase 3 — Sync Mechanism (choose one, document)

- **Manual (default):** When OSS adds `gym/drills/normal/foo.py`, private maintainer runs `rsync -a ../oss/gym/drills/ data/drills/` + commit.
- **Scripted:** Add `scripts/sync-from-oss.sh`:
  ```bash
  #!/usr/bin/env bash
  set -euo pipefail
  OSS=${1:-../leetcode-template-gym}
  rsync -av --delete "$OSS/gym/drills/" data/drills/
  rsync -av --delete "$OSS/solutions/canonical/" data/canonical/
  npm run build
  ```
- **Submodule upgrade (if needed later):** `git submodule add -b main https://github.com/cyprusad/leetcode-template-gym vendor/oss` + point generators to `vendor/oss/...`. Document trade-off.

Add `data/README.md` stub:
> `data/` is a vendored snapshot of `github.com/cyprusad/leetcode-template-gym/{gym/drills,solutions/canonical}` at `1d8751a`. MIT portions © 2026, see `LICENSE_MIT`. Sync via `scripts/sync-from-oss.sh`.

### Phase 4 — Decommission `web/` in OSS

Once private `main` builds and deploys to `/var/www/leetcode-gym-web` successfully:

```bash
# in OSS repo, branch chore/remove-web
git rm -r web/
# patch README.md: replace web section with pointer
# e.g. "Web app has moved to private repo … — see data/README.md for open data"
git commit -m "chore: extract web to private repo (data vendored @ 1d8751a)"
git push origin chore/remove-web # PR, then tag
```

Keep `solutions/canonical/` in OSS — web still *consumes* them but no longer *contains* the web.

### Phase 5 — Ops Cutover

- Update VPS deploy script from `.../leetcode-template-gym/web/dist` to `.../leetcode-gym-web-private/dist`.
- No Nginx change needed beyond `root` path.
- Verify `https://gym.interviewprep.party` serves new build.

---

## 7. Licensing & Attribution

- OSS is `LICENSE:1` MIT (2026). MIT *allows* sublicensing into closed-source, provided copyright + permission notice is preserved.
- Private repo must include `LICENSE_MIT` copy + attribution in `README.md`:
  > “Portions derived from `github.com/cyprusad/leetcode-template-gym` © 2026, MIT Licensed. Vendored data at `data/`.”
- If private repo adds proprietary branding/paywall, ensure `MIT` notice does not imply whole private app is MIT — add `LICENSE_PRIVATE` for new code, keep MIT notice scoped to `data/` + any copied `web/src` that was MIT.
- No CLA needed; single author.

---

## 8. Open Questions (resolve before merge)

- [ ] **Do you want `web/` history preserved?** → Yes = `git subtree`; No = simple `cp`.
- [ ] **Sync cadence?** → Weekly manual is likely enough (28 drills stable). Choose manual vs. submodule now.
- [ ] **Should OSS `solutions/canonical/` stay the single source of truth?** → If private repo starts authoring canonicals privately, divergence risk. Decide: OSS is source, private overlays `data/canonical-private/` (optional).
- [ ] **Monorepo tooling?** → Private repo may want `pnpm` or `npm workspaces` later — out of scope.
- [ ] **Future drill editor?** → If private web adds “create drill” UI, consider bidirectional sync.

---

## 9. Checklist for Approval

- [ ] Approve vendored `data/` approach vs. submodule
- [ ] Approve tagging `web-extraction-base`
- [ ] Create private repo `leetcode-gym-web-private`
- [ ] Run Phase 1-2, verify `npm test` + `npm run build` + manual “Pick random → Peek → Compare” flow
- [ ] PR `chore: extract web to private repo` in OSS
- [ ] Update VPS deploy to new `dist` path
- [ ] Announce in `README.md` that `web/` moved

---

## 10. Appendix — Evidence

- `web/package.json:7` `dev` = `generate-drills && generate-solutions && vite` — hard coupling to `../gym/drills`, `../solutions/canonical`
- `web/src/App.tsx:3-4` dynamic imports only from `generated/` — no direct `gym.py`
- `gym.py:9-12` defines `DRILLS = ROOT / "gym" / "drills"` — CLI-only, not imported by web
- `solutions/canonical/README.md:1` explains vendoring contract — already designed for copy
- Build output `web/src/generated/drills.json` (28) + `canonical-solutions.json` (28) tracked — vendoring feasible
- Bundle size `~500kB` (`dist/assets/index-*.js 501.17kB`) — self-contained, no server

*This plan makes `gym/drills` + `solutions/canonical` the **stable interface** between OSS and closed web. The web’s 60 modules, 22 tests, and Pyodide runtime move verbatim; only two generator paths change.*
