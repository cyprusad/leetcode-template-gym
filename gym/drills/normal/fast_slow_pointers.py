"""DRILL: Linked-list fast/slow pointers. Target: <= 2 minutes."""
class ListNode:
    def __init__(self, val, next=None):
        self.val, self.next = val, next

def has_cycle(head):
    # TODO: Floyd's tortoise/hare.
    pass

a = ListNode(1); b = ListNode(2); c = ListNode(3)
a.next=b; b.next=c
assert has_cycle(a) is False
c.next=b
assert has_cycle(a) is True
assert has_cycle(None) is False
print("PASS")
