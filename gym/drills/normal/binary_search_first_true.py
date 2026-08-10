"""DRILL: Binary search on answer / first True. Target: <= 2 minutes."""
def first_true(lo, hi, condition):
    # TODO: inclusive [lo, hi]. Return first x satisfying condition, or -1.
    pass

assert first_true(0, 10, lambda x: x >= 6) == 6
assert first_true(0, 0, lambda x: True) == 0
assert first_true(0, 5, lambda x: False) == -1
print("PASS")
