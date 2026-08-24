"""DRILL: Recursive tree DFS. Target: <= 90 seconds."""
class Node:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def preorder(root):
    res = []
    def dfs(node):
        if not node:
            return
        res.append(node.val)
        dfs(node.left)
        dfs(node.right)
    dfs(root)
    return res

root = Node(1, Node(2, Node(4), Node(5)), Node(3))
assert preorder(root) == [1,2,4,5,3]
assert preorder(None) == []
print("PASS")
