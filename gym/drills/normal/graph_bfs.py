"""DRILL: Graph BFS adjacency list. Target: <= 90 seconds."""
def bfs_distances(graph, start):
    # TODO: shortest unweighted distance from start; return dict.
    pass

g = {0:[1,2], 1:[3], 2:[3], 3:[], 4:[]}
assert bfs_distances(g, 0) == {0:0,1:1,2:1,3:2}
assert bfs_distances(g, 4) == {4:0}
print("PASS")
