"""DRILL: Monotonic stack. Target: <= 2 minutes."""
def next_greater(nums):
    n = len(nums)
    ans = [-1] * n
    stack = []  # indices with decreasing values
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            ans[stack.pop()] = x
        stack.append(i)
    return ans

assert next_greater([2,1,2,4,3]) == [4,2,4,-1,-1]
assert next_greater([5,4,3]) == [-1,-1,-1]
assert next_greater([]) == []
print("PASS")
