"""DRILL: Union-Find / DSU. Target: <= 3 minutes."""
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.rank[ra] < self.rank[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        if self.rank[ra] == self.rank[rb]:
            self.rank[ra] += 1
        return True

d = DSU(5)
assert d.union(0,1) is True
assert d.union(1,2) is True
assert d.find(0) == d.find(2)
assert d.union(0,2) is False
assert d.find(3) != d.find(0)
print("PASS")
