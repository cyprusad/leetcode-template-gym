"""DRILL: Kahn topological sort. Target: <= 3 minutes."""
from collections import deque, defaultdict

def topo_sort(n, edges):
    graph = defaultdict(list)
    indeg = [0] * n
    for u, v in edges:
        graph[u].append(v)
        indeg[v] += 1
    q = deque([i for i in range(n) if indeg[i] == 0])
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else []

order = topo_sort(4, [(0,1),(0,2),(1,3),(2,3)])
assert len(order) == 4
pos = {x:i for i,x in enumerate(order)}
assert pos[0] < pos[1] and pos[0] < pos[2]
assert pos[1] < pos[3] and pos[2] < pos[3]
assert topo_sort(2, [(0,1),(1,0)]) == []
print("PASS")
