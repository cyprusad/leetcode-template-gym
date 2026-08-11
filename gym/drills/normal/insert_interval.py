"""DRILL: Insert interval / three-position scan. Target: <= 2 minutes."""
def insert_interval(intervals, new_interval):
    # TODO: append left intervals, merge overlaps, then append the rest.
    pass

assert insert_interval([], [2,5]) == [[2,5]]
assert insert_interval([[1,3],[6,9]], [2,5]) == [[1,5],[6,9]]
assert insert_interval([[1,2],[3,5],[6,7],[8,10],[12,16]], [4,8]) == [[1,2],[3,10],[12,16]]
assert insert_interval([[1,5]], [6,8]) == [[1,5],[6,8]]
print("PASS")
