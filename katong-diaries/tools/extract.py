"""Pass 1: pull everything within RADIUS of the reference point out of the Singapore
OSM extract into a compact intermediate JSON (raw.json) for later processing."""
import sys, json, math
import osmium

PBF = sys.argv[1]
OUT = sys.argv[2]
LAT0, LON0 = 1.3051395, 103.9043997   # Starbucks Katong Square, 86 East Coast Rd (old Joo Chiat Police Station)
RADIUS = 5500.0                   # metres; a little beyond 5 km so edges are clean

KX = math.cos(math.radians(LAT0)) * 111320.0
KY = 110574.0


def xy(lat, lon):
    return ((lon - LON0) * KX, (lat - LAT0) * KY)


def inside(lat, lon, r=RADIUS):
    x, y = xy(lat, lon)
    return x * x + y * y <= r * r


POI_KEYS = ("amenity", "shop", "tourism", "leisure", "craft", "office", "historic",
            "healthcare", "sport", "club", "railway", "public_transport", "highway",
            "natural", "man_made", "place", "emergency", "barrier")


class H(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.nodes = []      # tagged nodes
        self.ways = []       # linear ways (highway, waterway, railway, barrier...)
        self.areas = []      # closed polygons (buildings, landuse, leisure, natural...)
        self.n_way = 0

    def node(self, n):
        if len(n.tags) == 0:
            return
        if not n.location.valid():
            return
        lat, lon = n.location.lat, n.location.lon
        if not inside(lat, lon):
            return
        tags = {t.k: t.v for t in n.tags}
        if not any(k in tags for k in POI_KEYS) and "name" not in tags and "addr:housenumber" not in tags:
            return
        x, y = xy(lat, lon)
        self.nodes.append({"id": n.id, "x": round(x, 2), "y": round(y, 2), "t": tags})

    def way(self, w):
        tags = w.tags
        if not ("highway" in tags or "waterway" in tags or "railway" in tags
                or "barrier" in tags or "man_made" in tags or "aeroway" in tags
                or tags.get("natural") in ("coastline", "tree_row")):
            return
        pts = []
        anyin = False
        for nd in w.nodes:
            if not nd.location.valid():
                continue
            lat, lon = nd.location.lat, nd.location.lon
            if inside(lat, lon):
                anyin = True
            x, y = xy(lat, lon)
            pts.append((round(x, 2), round(y, 2)))
        if not anyin or len(pts) < 2:
            return
        self.ways.append({"id": w.id, "t": {t.k: t.v for t in tags}, "p": pts,
                          "closed": w.is_closed()})

    def area(self, a):
        tags = a.tags
        keys = ("building", "building:part", "landuse", "leisure", "natural", "amenity",
                "shop", "tourism", "water", "waterway", "man_made", "highway", "place",
                "historic", "office", "craft", "healthcare", "sport", "area:highway")
        if not any(k in tags for k in keys):
            return
        polys = []
        anyin = False
        for outer in a.outer_rings():
            o = []
            for nd in outer:
                lat, lon = nd.lat, nd.lon
                if inside(lat, lon):
                    anyin = True
                x, y = xy(lat, lon)
                o.append((round(x, 2), round(y, 2)))
            inners = []
            for inner in a.inner_rings(outer):
                inners.append([(round(xy(nd.lat, nd.lon)[0], 2), round(xy(nd.lat, nd.lon)[1], 2)) for nd in inner])
            polys.append({"o": o, "i": inners})
        if not anyin:
            return
        self.areas.append({"id": a.orig_id(), "w": a.from_way(), "t": {t.k: t.v for t in tags},
                           "g": polys})


h = H()
h.apply_file(PBF, locations=True, idx="flex_mem")
print("nodes", len(h.nodes), "ways", len(h.ways), "areas", len(h.areas))
with open(OUT, "w") as f:
    json.dump({"lat0": LAT0, "lon0": LON0, "kx": KX, "ky": KY,
               "nodes": h.nodes, "ways": h.ways, "areas": h.areas}, f)
