# Canonical Drill Solutions

Canonical references live under `normal/` or `advanced/` and use the exact
drill filename, for example `normal/binary_search.py`.

Each reference should be a complete executable drill source. Preserve the
docstring, starter harness, and starter assertions, and replace the TODO/pass
implementation with a concise representative pattern. Missing references are
valid: the web app hides the comparison card until a file exists.

The web build validates filenames against `gym/drills` and generates the
registry at `web/src/generated/canonical-solutions.json`.
