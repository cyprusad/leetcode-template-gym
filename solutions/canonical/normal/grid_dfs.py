"""DRILL: Grid DFS + visited. Target: <= 2 minutes."""
def count_islands(grid):
    if not grid or not grid[0]:
        return 0
    rows, cols = len(grid), len(grid[0])
    visited = [[False]*cols for _ in range(rows)]

    def dfs(r, c):
        if r < 0 or r >= rows or c < 0 or c >= cols:
            return
        if grid[r][c] != "1" or visited[r][c]:
            return
        visited[r][c] = True
        dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1)

    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and not visited[r][c]:
                dfs(r,c)
                count += 1
    return count

assert count_islands([
    ["1","1","0"],
    ["0","1","0"],
    ["1","0","1"],
]) == 3
assert count_islands([]) == 0
print("PASS")
