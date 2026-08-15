"""DRILL: Exact binary search. Target: <= 90 seconds."""
def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        middle = (left + right) // 2
        if nums[middle] == target:
            return middle
        if nums[middle] < target:
            left = middle + 1
        else:
            right = middle - 1
    return -1

assert binary_search([], 3) == -1
assert binary_search([5], 5) == 0
assert binary_search([1,3,5,7,9], 7) == 3
assert binary_search([1,3,5,7,9], 4) == -1
print("PASS")
