# LeetCode Template Gym

A speed-drill environment for getting core Python interview patterns into muscle memory.

## The loop

Do this for ~15–25 minutes before your normal LeetCode practice:

1. Run `./leetcode-gym pick 5`
2. A session folder is created under `sessions/` with 5 blank-ish drills.
3. Start a timer.
4. Implement each function **from memory**.
5. Run each file directly, e.g. `python sessions/.../01_binary_search.py`
6. Stop when all tests pass.
7. Run `./leetcode-gym log <session-folder>` to record your result.

The point is **not** to solve a Medium. The problem and signature are already given.
You're drilling the mechanical skeleton: initialize → loop/recurse → invariant → update → return.

After the gym, do your normal LeetCode work. The gym trains **implementation recall**;
LeetCode trains **pattern recognition + problem solving**.

## Commands

```bash
./leetcode-gym --help
./leetcode-gym list
./leetcode-gym list --mode advanced
./leetcode-gym pick 5
./leetcode-gym pick 5 --mode advanced
./leetcode-gym pick 5 --seed 42
./leetcode-gym stats
./leetcode-gym reset-stats
```

No dependencies. Python 3.10+ recommended.

## Web app

A static browser version now lives under [`web/`](./web).

It reuses the same drill files, runs them in-browser with Pyodide, and provides:

- separate normal and advanced buckets
- drag-and-drop reordering and re-bucketing
- Monaco editor + xterm terminal layout
- random pick flow with a 3-second countdown and visible timer
- local analytics for solve attempts

Build it with:

```bash
cd web
npm install
npm run build
```

Deployment details for a VPS + Cloudflare setup are in [`web/README.md`](./web/README.md).

## Patterns included

Normal:
- Binary search
- Binary search: first true
- Two pointers
- Fixed sliding window
- Variable sliding window
- Prefix sum + hashmap
- Stack / monotonic stack
- Heap / top-K
- Linked-list fast/slow
- Linked-list reversal

Trees / graphs:
- Recursive DFS
- Iterative DFS
- BFS
- Level-order BFS
- Grid DFS
- Grid BFS
- Topological sort (Kahn)

Backtracking / data structures:
- Subsets backtracking
- Permutations backtracking
- Combination-style backtracking
- Trie

Advanced:
- 1-D DP
- 2-D grid DP
- Union-Find / DSU

## Rules for the drill

Don't autocomplete from an AI/copilot. Ideally disable suggestions during the 20-minute gym.
Python language-server completion is fine if you want it, but try to type imports and common
constructs yourself.

If you fail a drill, immediately rewrite it once from a fresh file. That second rep is where
the pattern tends to stick.
