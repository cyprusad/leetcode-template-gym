"""DRILL: Permutations backtracking. Target: <= 3 minutes."""
def permutations(nums):
    res = []
    path = []
    used = [False] * len(nums)

    def backtrack():
        if len(path) == len(nums):
            res.append(path.copy())
            return
        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            path.append(nums[i])
            backtrack()
            path.pop()
            used[i] = False

    backtrack()
    return res

out = permutations([1,2,3])
assert len(out) == 6
assert [1,2,3] in out and [3,2,1] in out
assert permutations([]) == [[]]
print("PASS")
