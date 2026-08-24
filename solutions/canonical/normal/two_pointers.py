"""DRILL: Opposite-direction two pointers. Target: <= 90 seconds."""
def pair_sum_sorted(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        s = nums[lo] + nums[hi]
        if s == target:
            return (lo, hi)
        elif s < target:
            lo += 1
        else:
            hi -= 1
    return None

assert pair_sum_sorted([1,2,4,7,11], 9) == (1,3)
assert pair_sum_sorted([1,2], 10) is None
assert pair_sum_sorted([-3,-1,2,5], 1) == (1,2)
print("PASS")
