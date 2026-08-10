"""DRILL: Trie insert/search/prefix. Target: <= 4 minutes."""
class TrieNode:
    def __init__(self):
        # TODO
        pass

class Trie:
    def __init__(self):
        # TODO
        pass

    def insert(self, word):
        # TODO
        pass

    def search(self, word):
        # TODO
        pass

    def starts_with(self, prefix):
        # TODO
        pass

t = Trie()
t.insert("apple")
assert t.search("apple") is True
assert t.search("app") is False
assert t.starts_with("app") is True
t.insert("app")
assert t.search("app") is True
print("PASS")
