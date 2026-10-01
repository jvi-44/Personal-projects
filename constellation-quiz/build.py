"""Builds index.html from template.html + d3-celestial data (fetched from jsDelivr).
Usage: python3 build.py
"""
import json, math, urllib.request, collections
BASE = "https://cdn.jsdelivr.net/gh/ofrohn/d3-celestial@master/data/"
def get(n): return json.load(urllib.request.urlopen(BASE + n, timeout=60))
meta, lines, bounds, stars = (get(n) for n in
    ("constellations.json", "constellations.lines.json", "constellations.bounds.json", "stars.6.json"))

def merge_id(i): return "Ser" if i in ("Ser1", "Ser2") else i
def r2(p): return [round(p[0], 2), round(p[1], 2)]
def vec(ra, dec):
    a, d = math.radians(ra), math.radians(dec)
    return (math.cos(d)*math.cos(a), math.cos(d)*math.sin(a), math.sin(d))
def ang(u, v): return math.acos(max(-1, min(1, sum(x*y for x, y in zip(u, v)))))

C = {}
for f in meta["features"]:
    i = merge_id(f["id"]); p = f["properties"]
    c = C.setdefault(i, {"id": i, "name": "Serpens" if i == "Ser" else p["name"],
                         "en": "Serpent" if i == "Ser" else p["en"], "lines": [], "polys": []})
for f in lines["features"]:
    C[merge_id(f["id"])]["lines"] += [[r2(p) for p in seg] for seg in f["geometry"]["coordinates"]]
verts = collections.defaultdict(set)
for f in bounds["features"]:
    i = merge_id(f["id"]); g = f["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    for poly in polys:
        ring = poly[0]; C[i]["polys"].append([r2(p) for p in ring])
        for p in ring: verts[(round(p[0], 1) % 360, round(p[1], 1))].add(i)
# adjacency from shared boundary vertices
adj = collections.defaultdict(collections.Counter)
for s in verts.values():
    for a in s:
        for b in s:
            if a != b: adj[a][b] += 1
for i, c in C.items():
    vs = [vec(*p) for poly in c["polys"] for p in poly]
    m = [sum(v[k] for v in vs) for k in range(3)]; n = math.sqrt(sum(x*x for x in m)); m = [x/n for x in m]
    c["ra"] = round(math.degrees(math.atan2(m[1], m[0])) % 360, 2); c["dec"] = round(math.degrees(math.asin(m[2])), 2)
    c["rad"] = round(math.degrees(max(ang(m, v) for v in vs)), 1)
    c["adj"] = [b for b, _ in adj[i].most_common() if adj[i][b] >= 2]
    assert c["adj"], i
S = [[round(f["geometry"]["coordinates"][0], 2), round(f["geometry"]["coordinates"][1], 2), f["properties"]["mag"]] for f in stars["features"]]
data = {"c": sorted(C.values(), key=lambda c: c["name"]), "s": S}
assert len(data["c"]) == 88
js = "const DATA=" + json.dumps(data, separators=(",", ":")) + ";"
open("index.html", "w").write(open("template.html").read().replace("/*DATA*/", js))
print(len(data["c"]), "constellations,", len(S), "stars,", len(js)//1024, "KB; min neighbours:", min(len(c["adj"]) for c in data["c"]))
