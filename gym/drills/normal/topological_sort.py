"""DRILL: Kahn topological sort. Target: <= 3 minutes."""
def topo_sort(n, edges):
    # TODO: edges are (u,v): u must come before v. Return [] on cycle.
    pass

order = topo_sort(4, [(0,1),(0,2),(1,3),(2,3)])
assert len(order) == 4
pos = {x:i for i,x in enumerate(order)}
assert pos[0] < pos[1] and pos[0] < pos[2]
assert pos[1] < pos[3] and pos[2] < pos[3]
assert topo_sort(2, [(0,1),(1,0)]) == []
print("PASS")
