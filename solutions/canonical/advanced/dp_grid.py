"""DRILL: 2-D/grid DP. Target: <= 2 minutes."""
def unique_paths(m, n):
    # 1-D DP: dp[j] = paths to (i,j)
    dp = [1] * n
    for i in range(1, m):
        for j in range(1, n):
            dp[j] += dp[j-1]
    return dp[-1] if n else 0

assert unique_paths(3, 7) == 28
assert unique_paths(1, 5) == 1
assert unique_paths(2, 2) == 2
print("PASS")
