"""DRILL: Tree level-order BFS. Target: <= 2 minutes."""
from collections import deque

class Node:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def level_order(root):
    if not root:
        return []
    q = deque([root])
    res = []
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        res.append(level)
    return res

root = Node(1, Node(2, Node(4)), Node(3))
assert level_order(root) == [[1],[2,3],[4]]
assert level_order(None) == []
print("PASS")
