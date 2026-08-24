"""DRILL: 1-D DP. Target: <= 2 minutes."""
def house_robber(nums):
    prev2 = prev1 = 0
    for x in nums:
        cur = max(prev1, prev2 + x)
        prev2, prev1 = prev1, cur
    return prev1

assert house_robber([1,2,3,1]) == 4
assert house_robber([2,7,9,3,1]) == 12
assert house_robber([]) == 0
print("PASS")
