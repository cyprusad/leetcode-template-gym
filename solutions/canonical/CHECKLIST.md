# Canonical Solutions Evaluation Checklist

All 28 canonical solutions have been generated and validated (`python <file>` => PASS, `npm run build` => 28 records).
Mark each as ✅ approved or ❌ needs revision. Once approved we can ship the full peek/compare feature.

## Normal (25)
- [ ] `normal:binary_search` - `solutions/canonical/normal/binary_search.py` (existing, reference)
- [ ] `normal:binary_search_first_true` - `binary_search_first_true.py` - inclusive [lo,hi] first True pattern
- [ ] `normal:two_pointers` - `two_pointers.py` - opposite-direction sorted pair
- [ ] `normal:sliding_window_fixed` - `sliding_window_fixed.py` - sum window of exactly k
- [ ] `normal:sliding_window_variable` - `sliding_window_variable.py` - longest unique substring with hashmap + left pointer
- [ ] `normal:prefix_sum_hashmap` - `prefix_sum_hashmap.py` - prefix freq defaultdict
- [ ] `normal:monotonic_stack` - `monotonic_stack.py` - next greater value
- [ ] `normal:heap_top_k` - `heap_top_k.py` - min-heap of size k, sorted descending
- [ ] `normal:fast_slow_pointers` - `fast_slow_pointers.py` - Floyd's tortoise/hare
- [ ] `normal:linked_list_reverse` - `linked_list_reverse.py` - iterative prev/cur/nxt
- [ ] `normal:tree_recursive_dfs` - `tree_recursive_dfs.py` - recursive root-left-right
- [ ] `normal:tree_iterative_dfs` - `tree_iterative_dfs.py` - stack with right-pushed-first
- [ ] `normal:tree_level_order_bfs` - `tree_level_order_bfs.py` - queue level loop
- [ ] `normal:graph_dfs` - `graph_dfs.py` - iterative stack + visited set
- [ ] `normal:graph_bfs` - `graph_bfs.py` - deque distances dict
- [ ] `normal:grid_dfs` - `grid_dfs.py` - count islands visited matrix + recursive dfs
- [ ] `normal:grid_bfs` - `grid_bfs.py` - shortest path deque + dist matrix 4 dirs
- [ ] `normal:topological_sort` - `topological_sort.py` - Kahn indegree queue, [] on cycle
- [ ] `normal:backtracking_subsets` - `backtracking_subsets.py` - choose/recurse/undo
- [ ] `normal:backtracking_permutations` - `backtracking_permutations.py` - used[] + append/pop
- [ ] `normal:backtracking_combinations` - `backtracking_combinations.py` - start index loop
- [ ] `normal:trie` - `trie.py` - TrieNode children + is_end
- [ ] `normal:merge_intervals` - `merge_intervals.py` - sort by start, merge overlaps
- [ ] `normal:insert_interval` - `insert_interval.py` - three-phase scan
- [ ] `normal:interval_intersection` - `interval_intersection.py` - two pointers max(lo)/min(hi)

## Advanced (3)
- [ ] `advanced:dp_1d` - `dp_1d.py` - house robber O(1) space max(prev1, prev2+x)
- [ ] `advanced:dp_grid` - `dp_grid.py` - unique paths 1-D DP
- [ ] `advanced:union_find` - `union_find.py` - DSU parent/rank + path compression

## Validation
- [x] All 28 files execute `PASS`
- [x] `web/scripts/generate-solutions.mjs` => 28 records at `web/src/generated/canonical-solutions.json`
- [x] `npm test` 18/18 passed
- [x] `npm run build` succeeds

## Next after approval
- Commit + push (already generated, not yet pushed)
- Enable comparison card for all drills (no code change needed, just registry presence)
- Optional: add unlock reason text, fallback progress indicator per spec gaps

Reply with e.g. "approve all" or list specific drills to revise.
