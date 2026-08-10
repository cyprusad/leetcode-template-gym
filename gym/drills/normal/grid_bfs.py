"""DRILL: Grid BFS shortest path. Target: <= 3 minutes."""
def shortest_path(grid, start, end):
    # TODO: 0=open, 1=blocked; 4 dirs. Return edge distance, else -1.
    pass

g = [
    [0,0,1],
    [1,0,0],
    [0,0,0],
]
assert shortest_path(g, (0,0), (2,2)) == 4
assert shortest_path([[0,1],[1,0]], (0,0), (1,1)) == -1
print("PASS")
