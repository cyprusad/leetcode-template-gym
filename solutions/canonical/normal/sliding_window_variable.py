"""DRILL: Variable sliding window. Target: <= 2 minutes."""
def longest_unique(s):
    last = {}
    left = 0
    best = 0
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best

assert longest_unique("") == 0
assert longest_unique("abcabcbb") == 3
assert longest_unique("bbbbb") == 1
assert longest_unique("pwwkew") == 3
print("PASS")
