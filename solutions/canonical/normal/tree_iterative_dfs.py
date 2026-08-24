"""DRILL: Iterative tree DFS with stack. Target: <= 2 minutes."""
class Node:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def preorder(root):
    if not root:
        return []
    stack = [root]
    res = []
    while stack:
        node = stack.pop()
        res.append(node.val)
        if node.right:
            stack.append(node.right)
        if node.left:
            stack.append(node.left)
    return res

root = Node(1, Node(2, Node(4), Node(5)), Node(3))
assert preorder(root) == [1,2,4,5,3]
assert preorder(None) == []
print("PASS")
