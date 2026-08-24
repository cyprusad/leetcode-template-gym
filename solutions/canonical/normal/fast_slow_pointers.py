"""DRILL: Linked-list fast/slow pointers. Target: <= 2 minutes."""
class ListNode:
    def __init__(self, val, next=None):
        self.val, self.next = val, next

def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False

a = ListNode(1); b = ListNode(2); c = ListNode(3)
a.next=b; b.next=c
assert has_cycle(a) is False
c.next=b
assert has_cycle(a) is True
assert has_cycle(None) is False
print("PASS")
