"""DRILL: Prefix sum + frequency hashmap. Target: <= 2 minutes."""
from collections import defaultdict

def subarray_sum(nums, k):
    count = 0
    prefix = 0
    freq = defaultdict(int)
    freq[0] = 1
    for x in nums:
        prefix += x
        count += freq[prefix - k]
        freq[prefix] += 1
    return count

assert subarray_sum([1,1,1], 2) == 2
assert subarray_sum([1,2,3], 3) == 2
assert subarray_sum([1,-1,0], 0) == 3
print("PASS")
