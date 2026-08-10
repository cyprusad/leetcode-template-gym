"""DRILL: Graph DFS adjacency list. Target: <= 90 seconds."""
def dfs(graph, start):
    # TODO: iterative or recursive; return set of reachable nodes.
    pass

g = {0:[1,2], 1:[2], 2:[3], 3:[], 4:[]}
assert dfs(g, 0) == {0,1,2,3}
assert dfs(g, 4) == {4}
print("PASS")
