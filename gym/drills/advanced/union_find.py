"""DRILL: Union-Find / DSU. Target: <= 3 minutes."""
class DSU:
    def __init__(self, n):
        # TODO
        pass

    def find(self, x):
        # TODO: path compression
        pass

    def union(self, a, b):
        # TODO: union by rank/size; return False if already connected.
        pass

d = DSU(5)
assert d.union(0,1) is True
assert d.union(1,2) is True
assert d.find(0) == d.find(2)
assert d.union(0,2) is False
assert d.find(3) != d.find(0)
print("PASS")
