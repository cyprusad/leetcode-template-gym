"""DRILL: Permutations backtracking. Target: <= 3 minutes."""
def permutations(nums):
    # TODO: choose unused -> append -> recurse -> pop/unchoose.
    pass

out = permutations([1,2,3])
assert len(out) == 6
assert [1,2,3] in out and [3,2,1] in out
assert permutations([]) == [[]]
print("PASS")
