"""DRILL: Graph BFS adjacency list. Target: <= 90 seconds."""
from collections import deque

def bfs_distances(graph, start):
    dist = {start: 0}
    q = deque([start])
    while q:
        u = q.popleft()
        for v in graph.get(u, []):
            if v not in dist:
                dist[v] = dist[u] + 1
                q.append(v)
    return dist

g = {0:[1,2], 1:[3], 2:[3], 3:[], 4:[]}
assert bfs_distances(g, 0) == {0:0,1:1,2:1,3:2}
assert bfs_distances(g, 4) == {4:0}
print("PASS")
