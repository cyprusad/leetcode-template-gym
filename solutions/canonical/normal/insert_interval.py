"""DRILL: Insert interval / three-position scan. Target: <= 2 minutes."""
def insert_interval(intervals, new_interval):
    res = []
    i = 0
    n = len(intervals)
    # left: strictly before
    while i < n and intervals[i][1] < new_interval[0]:
        res.append(intervals[i])
        i += 1
    # merge overlapping
    while i < n and intervals[i][0] <= new_interval[1]:
        new_interval = [min(new_interval[0], intervals[i][0]), max(new_interval[1], intervals[i][1])]
        i += 1
    res.append(new_interval)
    # right
    while i < n:
        res.append(intervals[i])
        i += 1
    return res

assert insert_interval([], [2,5]) == [[2,5]]
assert insert_interval([[1,3],[6,9]], [2,5]) == [[1,5],[6,9]]
assert insert_interval([[1,2],[3,5],[6,7],[8,10],[12,16]], [4,8]) == [[1,2],[3,10],[12,16]]
assert insert_interval([[1,5]], [6,8]) == [[1,5],[6,8]]
print("PASS")
