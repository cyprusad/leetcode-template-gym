"""DRILL: Heap / top-K. Target: <= 2 minutes."""
import heapq

def k_largest(nums, k):
    if k <= 0:
        return []
    heap = []
    for x in nums:
        if len(heap) < k:
            heapq.heappush(heap, x)
        elif x > heap[0]:
            heapq.heapreplace(heap, x)
    return sorted(heap, reverse=True)

assert k_largest([3,2,1,5,6,4], 2) == [6,5]
assert k_largest([1], 1) == [1]
assert k_largest([4,4,2,9], 3) == [9,4,4]
print("PASS")
