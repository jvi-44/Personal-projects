"""Politely run many Commons searches (honouring Retry-After) and save candidates to JSON."""
import json, sys, time, urllib.error
sys.path.insert(0, __import__("os").path.dirname(__file__))
from commons import search

queries = json.load(open(sys.argv[1])); out_path = sys.argv[2]
try: results = json.load(open(out_path))
except Exception: results = {}
for q in queries:
    if q in results: continue
    for attempt in range(8):
        try:
            results[q] = search(q, 14, 1280); break
        except urllib.error.HTTPError as e:
            wait = int(e.headers.get("retry-after", 60)) + 5 if e.code == 429 else 30
            print(f"{q}: HTTP {e.code}, waiting {wait}s", flush=True); time.sleep(wait)
        except Exception as e:
            print(f"{q}: {e}", flush=True); time.sleep(30)
    json.dump(results, open(out_path, "w"), indent=1)
    print(f"done {q}: {len(results.get(q, []))}", flush=True)
    time.sleep(12)
