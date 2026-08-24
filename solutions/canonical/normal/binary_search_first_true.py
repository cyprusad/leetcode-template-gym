"""DRILL: Binary search on answer / first True. Target: <= 2 minutes."""
def first_true(lo, hi, condition):
    ans = -1
    while lo <= hi:
        mid = (lo + hi) // 2
        if condition(mid):
            ans = mid
            hi = mid - 1
        else:
            lo = mid + 1
    return ans

assert first_true(0, 10, lambda x: x >= 6) == 6
assert first_true(0, 0, lambda x: True) == 0
assert first_true(0, 5, lambda x: False) == -1
print("PASS")
