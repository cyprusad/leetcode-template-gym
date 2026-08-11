"""DRILL: Interval intersection / two sorted lists. Target: <= 2 minutes."""
def interval_intersection(a, b):
    # TODO: two pointers; intersect inward with max(start), min(end).
    pass

assert interval_intersection([], [[1,3]]) == []
assert interval_intersection([[1,3]], []) == []
assert interval_intersection([[0,2],[5,10],[13,23],[24,25]], [[1,5],[8,12],[15,24],[25,26]]) == [[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]
assert interval_intersection([[1,7]], [[3,10]]) == [[3,7]]
print("PASS")
