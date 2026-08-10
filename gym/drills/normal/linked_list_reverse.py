"""DRILL: Iterative linked-list reversal. Target: <= 90 seconds."""
class ListNode:
    def __init__(self, val, next=None):
        self.val, self.next = val, next

def reverse(head):
    # TODO
    pass

def vals(head):
    out = []
    while head:
        out.append(head.val); head = head.next
    return out

h = ListNode(1, ListNode(2, ListNode(3)))
assert vals(reverse(h)) == [3,2,1]
assert reverse(None) is None
print("PASS")
