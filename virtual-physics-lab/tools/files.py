"""Print the Artifact `files` map for everything under app/ except index.html and raw .xlsx."""
import json, os, sys
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'app')
only = sys.argv[1:]  # optional path prefixes
out = {}
for d, _, fs in os.walk(root):
    for f in fs:
        rel = os.path.relpath(os.path.join(d, f), root)
        if rel == 'index.html' or rel.endswith('.xlsx'):
            continue
        if only and not any(rel.startswith(o) for o in only):
            continue
        out[rel] = 'app/' + rel
print(json.dumps(dict(sorted(out.items()))))
