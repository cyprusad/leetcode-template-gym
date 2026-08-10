"""DRILL: Combination backtracking with start index. Target: <= 3 minutes."""
def combinations(nums, k):
    # TODO: choose k values, preserving input index order.
    pass

out = combinations([1,2,3,4], 2)
assert len(out) == 6
assert [1,2] in out and [3,4] in out
assert combinations([1,2], 0) == [[]]
print("PASS")
