"""DRILL: Tree level-order BFS. Target: <= 2 minutes."""
class Node:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def level_order(root):
    # TODO: return [[level0], [level1], ...].
    pass

root = Node(1, Node(2, Node(4)), Node(3))
assert level_order(root) == [[1],[2,3],[4]]
assert level_order(None) == []
print("PASS")
