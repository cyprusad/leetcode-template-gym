"""DRILL: Choose / recurse / undo. Target: <= 2 minutes."""
def subsets(nums):
    # TODO: classic backtracking; return all subsets.
    pass

out = subsets([1,2,3])
assert len(out) == 8
assert [] in out and [1,2,3] in out and [2] in out
assert subsets([]) == [[]]
print("PASS")
