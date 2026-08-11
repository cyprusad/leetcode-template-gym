"""DRILL: Merge intervals / overlap scan. Target: <= 2 minutes."""
def merge_intervals(intervals):
    # TODO: sort by start, then merge overlaps. Return merged intervals.
    pass

assert merge_intervals([]) == []
assert merge_intervals([[1,3]]) == [[1,3]]
assert merge_intervals([[1,3],[2,6],[8,10],[15,18]]) == [[1,6],[8,10],[15,18]]
assert merge_intervals([[1,4],[4,5]]) == [[1,5]]
assert merge_intervals([[5,7],[1,2],[2,4]]) == [[1,4],[5,7]]
print("PASS")
