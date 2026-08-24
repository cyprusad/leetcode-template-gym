"""DRILL: Choose / recurse / undo. Target: <= 2 minutes."""
def subsets(nums):
    res = []
    path = []

    def backtrack(i):
        res.append(path.copy())
        for j in range(i, len(nums)):
            path.append(nums[j])
            backtrack(j + 1)
            path.pop()

    backtrack(0)
    return res

out = subsets([1,2,3])
assert len(out) == 8
assert [] in out and [1,2,3] in out and [2] in out
assert subsets([]) == [[]]
print("PASS")
