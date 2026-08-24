"""DRILL: Interval intersection / two sorted lists. Target: <= 2 minutes."""
def interval_intersection(a, b):
    i = j = 0
    res = []
    while i < len(a) and j < len(b):
        lo = max(a[i][0], b[j][0])
        hi = min(a[i][1], b[j][1])
        if lo <= hi:
            res.append([lo, hi])
        if a[i][1] < b[j][1]:
            i += 1
        else:
            j += 1
    return res

assert interval_intersection([], [[1,3]]) == []
assert interval_intersection([[1,3]], []) == []
assert interval_intersection([[0,2],[5,10],[13,23],[24,25]], [[1,5],[8,12],[15,24],[25,26]]) == [[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]
assert interval_intersection([[1,7]], [[3,10]]) == [[3,7]]
print("PASS")
