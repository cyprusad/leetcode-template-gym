"""DRILL: Graph DFS adjacency list. Target: <= 90 seconds."""
def dfs(graph, start):
    visited = set()
    stack = [start]
    while stack:
        u = stack.pop()
        if u in visited:
            continue
        visited.add(u)
        for v in graph.get(u, []):
            if v not in visited:
                stack.append(v)
    return visited

g = {0:[1,2], 1:[2], 2:[3], 3:[], 4:[]}
assert dfs(g, 0) == {0,1,2,3}
assert dfs(g, 4) == {4}
print("PASS")
