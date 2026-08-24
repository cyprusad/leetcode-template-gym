"""DRILL: Fixed-size sliding window. Target: <= 90 seconds."""
def max_sum_k(nums, k):
    if k <= 0 or not nums or k > len(nums):
        # drill guarantees valid k; fallback keeps function total
        return max(nums) if nums else 0
    window = sum(nums[:k])
    best = window
    for i in range(k, len(nums)):
        window += nums[i] - nums[i - k]
        if window > best:
            best = window
    return best

assert max_sum_k([1,4,2,10,2,3,1,0,20], 4) == 24
assert max_sum_k([5], 1) == 5
assert max_sum_k([-5,-2,-8], 2) == -7
print("PASS")
