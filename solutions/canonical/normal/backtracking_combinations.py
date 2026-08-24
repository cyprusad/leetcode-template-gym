"""DRILL: Combination backtracking with start index. Target: <= 3 minutes."""
def combinations(nums, k):
    res = []
    path = []

    def backtrack(start):
        if len(path) == k:
            res.append(path.copy())
            return
        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1)
            path.pop()

    backtrack(0)
    return res

out = combinations([1,2,3,4], 2)
assert len(out) == 6
assert [1,2] in out and [3,4] in out
assert combinations([1,2], 0) == [[]]
print("PASS")
