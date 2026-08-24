"""DRILL: Grid BFS shortest path. Target: <= 3 minutes."""
from collections import deque

def shortest_path(grid, start, end):
    if not grid or not grid[0]:
        return -1
    rows, cols = len(grid), len(grid[0])
    sr, sc = start
    er, ec = end
    if grid[sr][sc] == 1 or grid[er][ec] == 1:
        return -1
    dist = [[-1] * cols for _ in range(rows)]
    q = deque()
    q.append((sr, sc))
    dist[sr][sc] = 0
    dirs = [(1,0),(-1,0),(0,1),(0,-1)]
    while q:
        r, c = q.popleft()
        if (r, c) == (er, ec):
            return dist[r][c]
        for dr, dc in dirs:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0 and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                q.append((nr, nc))
    return -1

g = [
    [0,0,1],
    [1,0,0],
    [0,0,0],
]
assert shortest_path(g, (0,0), (2,2)) == 4
assert shortest_path([[0,1],[1,0]], (0,0), (1,1)) == -1
print("PASS")
