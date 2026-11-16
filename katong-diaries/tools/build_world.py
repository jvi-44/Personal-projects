#!/usr/bin/env python3
"""Pass 2: raw.json (OSM extract around Katong) -> compact world data.

Outputs (in OUTDIR):
  world.js        window.KD_WORLD = {...}  roads, buildings, areas, land, trees (binary, base64)
  geo_index.json  intermediate for the places pipeline (building address index, tiles)

Coordinates: metres from the origin (Starbucks Katong Square). x = east, z = south
(so north is -z), stored as integer decimetres.
"""
import json, math, sys, struct, base64, collections, random, hashlib
from shapely.geometry import Polygon, LineString, Point, MultiPolygon, MultiLineString
from shapely.strtree import STRtree
from shapely.ops import split, unary_union
from shapely import make_valid, set_precision

RAW, OUTDIR = sys.argv[1], sys.argv[2]
RW = 5000.0          # world radius (m)
TILE = 500.0         # tile size (m)
random.seed(11)

raw = json.load(open(RAW))
nodes, ways, areas = raw['nodes'], raw['ways'], raw['areas']
disc = Point(0, 0).buffer(RW, 96)
print('raw: nodes', len(nodes), 'ways', len(ways), 'areas', len(areas))


def dm(v):
    return int(round(v * 10))


def pint(v, default=None):
    try:
        return int(float(str(v).split(';')[0].strip()))
    except Exception:
        return default


def pfloat(v, default=None):
    try:
        s = str(v).lower().replace('m', '').strip().split(';')[0]
        return float(s)
    except Exception:
        return default


class StrTab:
    def __init__(self):
        self.idx = {'': 0}
        self.items = ['']

    def get(self, s):
        if not s:
            return 0
        s = str(s).strip()
        if s not in self.idx:
            self.idx[s] = len(self.items)
            self.items.append(s)
        return self.idx[s]


def tile_of(x, y):
    """tile key from metres (x east, y north)."""
    return (int(math.floor(x / TILE)), int(math.floor(-y / TILE)))


def polys_of(g):
    """Flatten any geometry to a list of valid Polygons."""
    if g is None or g.is_empty:
        return []
    if g.geom_type == 'Polygon':
        return [g]
    if g.geom_type in ('MultiPolygon', 'GeometryCollection'):
        out = []
        for p in g.geoms:
            out.extend(polys_of(p))
        return out
    return []


def lines_of(g):
    if g is None or g.is_empty:
        return []
    if g.geom_type == 'LineString':
        return [g]
    if g.geom_type in ('MultiLineString', 'GeometryCollection'):
        out = []
        for p in g.geoms:
            out.extend(lines_of(p))
        return out
    return []


def mkpoly(g):
    """raw area part {'o': ring, 'i': [rings]} -> valid shapely polygon(s)."""
    try:
        if len(g['o']) < 4:
            return []
        p = Polygon(g['o'], [r for r in g['i'] if len(r) >= 4])
        if not p.is_valid:
            p = make_valid(p)
        return polys_of(p)
    except Exception:
        return []


# --------------------------------------------------------------------------- roads
SKIP_HW = {'proposed', 'construction', 'corridor', 'elevator', 'raceway', 'rest_area', 'bus_stop',
           'platform', 'services', 'escape', 'bridleway', 'emergency_bay', 'bus_guideway'}
CLS = {'motorway': 0, 'motorway_link': 1, 'trunk': 2, 'trunk_link': 3, 'primary': 4, 'primary_link': 5,
       'secondary': 6, 'secondary_link': 7, 'tertiary': 8, 'tertiary_link': 9, 'residential': 10,
       'unclassified': 11, 'living_street': 12, 'service': 13, 'busway': 13, 'pedestrian': 14,
       'footway': 15, 'path': 16, 'cycleway': 17, 'steps': 18, 'track': 19, 'crossing': 20,
       'rail': 30, 'canal': 40, 'drain': 41, 'pier': 42, 'rock': 43}
DRIVABLE_MAX = 13


def road_width(t, hw):
    w = pfloat(t.get('width'))
    if w and 1.2 <= w <= 40:
        return w
    lanes = pint(t.get('lanes'))
    oneway = t.get('oneway') in ('yes', '1', 'true') or t.get('junction') == 'roundabout'
    if hw in ('motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'unclassified') or hw.endswith('_link'):
        if lanes and 1 <= lanes <= 8:
            return max(3.8, lanes * 3.3 + 0.9)
        if hw.endswith('_link'):
            return 5.0
        return {'motorway': 11.5, 'trunk': 10.5 if oneway else 14.0, 'primary': 10.5 if oneway else 13.5,
                'secondary': 8.0 if oneway else 11.0, 'tertiary': 7.0 if oneway else 8.5,
                'residential': 6.6, 'unclassified': 6.6}[hw]
    if hw == 'service' or hw == 'busway':
        sv = t.get('service')
        return {'driveway': 3.4, 'parking_aisle': 5.2, 'alley': 3.6, 'drive-through': 3.2}.get(sv, 4.4)
    if hw == 'living_street':
        return 5.5
    if hw == 'pedestrian':
        return 6.0
    if hw == 'footway':
        return 1.9 if t.get('footway') == 'sidewalk' else 2.3
    if hw == 'cycleway':
        return 3.2
    if hw == 'steps':
        return 2.4
    if hw == 'track':
        return 3.0
    return 1.8


names = StrTab()
road_recs = []       # dict(cls,width,flags,layer,name,pts[(x,y)],bridge,ped)
node_use = collections.Counter()   # (x,y) -> degree among drivable ways
node_w = {}                        # (x,y) -> max width

for w in ways:
    t = w['t']
    hw = t.get('highway')
    cls = None
    width = None
    if hw:
        if hw in SKIP_HW or t.get('area') == 'yes':
            continue
        if t.get('indoor') in ('yes', 'room', 'corridor', 'area'):
            continue
        layer = pint(t.get('layer'), 0) or 0
        level = pfloat(t.get('level'), 0) or 0
        tun = t.get('tunnel')
        if tun and tun not in ('no', 'building_passage', 'covered', 'avalanche_protector'):
            continue                      # underground (KPE, underpasses, MRT links)
        if layer < 0 or level < 0:
            continue
        if hw in ('footway', 'path') and level >= 1 and not t.get('bridge'):
            continue                      # upper-floor mall walkways
        key = 'crossing' if (hw in ('footway', 'cycleway', 'path') and (t.get('footway') == 'crossing' or t.get('cycleway') == 'crossing' or t.get('path') == 'crossing')) else hw
        if key not in CLS:
            continue
        cls = CLS[key]
        width = 3.6 if key == 'crossing' else road_width(t, hw)
    elif t.get('railway') in ('subway', 'light_rail', 'rail') and t.get('bridge') in ('yes', 'viaduct'):
        cls = CLS['rail']
        width = 4.6
        layer = pint(t.get('layer'), 1) or 1
    elif t.get('waterway') in ('canal', 'drain', 'river', 'stream', 'ditch'):
        if t.get('tunnel') and t.get('tunnel') != 'no':
            continue
        ww = t.get('waterway')
        cls = CLS['canal'] if ww in ('canal', 'river') else CLS['drain']
        width = pfloat(t.get('width')) or (9.0 if ww == 'river' else 7.0 if ww == 'canal' else 2.6)
        layer = 0
    elif t.get('man_made') in ('pier', 'breakwater', 'groyne') and not w['closed']:
        cls = CLS['pier'] if t.get('man_made') == 'pier' else CLS['rock']
        width = pfloat(t.get('width')) or (4.0 if t.get('man_made') == 'pier' else 5.0)
        layer = 0
    else:
        continue
    pts = w['p']
    if len(pts) < 2:
        continue
    bridge = t.get('bridge') in ('yes', 'viaduct', 'movable', 'cantilever', 'covered') and cls < 40
    flags = 0
    if t.get('oneway') in ('yes', '1', 'true') or t.get('junction') == 'roundabout':
        flags |= 1
    if bridge:
        flags |= 2
    if t.get('tunnel') == 'building_passage' or t.get('covered') == 'yes':
        flags |= 4
    if t.get('footway') == 'sidewalk':
        flags |= 8
    if hw == 'cycleway' or t.get('bicycle') == 'designated':
        flags |= 16
    rec = dict(cls=cls, width=width, flags=flags, layer=layer if bridge else 0, name=t.get('name') or t.get('name:en') or '',
               pts=[(p[0], p[1]) for p in pts], bridge=bridge, lanes=pint(t.get('lanes'), 0) or 0)
    road_recs.append(rec)
    if cls <= DRIVABLE_MAX:
        for i, p in enumerate(rec['pts']):
            k = (p[0], p[1])
            node_use[k] += 1 if i in (0, len(rec['pts']) - 1) else 2
            node_w[k] = max(node_w.get(k, 0), width)

print('road records', len(road_recs))

# ---- elevation of flyovers / viaducts / overhead bridges
drv_lines = []
drv_idx = []
for i, r in enumerate(road_recs):
    if r['cls'] <= 20 and not r['bridge']:
        drv_lines.append(LineString(r['pts']))
        drv_idx.append(i)
ground_tree = STRtree(drv_lines)
ground_nodes = set()
for i in drv_idx:
    for p in road_recs[i]['pts']:
        ground_nodes.add(p)

bridge_ids = [i for i, r in enumerate(road_recs) if r['bridge']]
elev = {}
for i in bridge_ids:
    r = road_recs[i]
    ls = LineString(r['pts'])
    own = set(r['pts'])
    crosses = False
    for j in ground_tree.query(ls):
        o = drv_lines[j]
        orec = road_recs[drv_idx[j]]
        if r['cls'] >= 14 and r['cls'] <= 20 and orec['cls'] > DRIVABLE_MAX:
            continue                       # footbridge over a footpath: not a real flyover
        if not ls.intersects(o):
            continue
        inter = ls.intersection(o)
        # shared nodes are junctions, not crossings
        ipts = []
        if inter.geom_type == 'Point':
            ipts = [inter]
        elif inter.geom_type == 'MultiPoint':
            ipts = list(inter.geoms)
        for ip in ipts:
            if not any(abs(ip.x - q[0]) < 0.05 and abs(ip.y - q[1]) < 0.05 for q in own):
                crosses = True
                break
        if crosses:
            break
    if crosses:
        elev[i] = True
# propagate along connected bridge ways with the same layer
by_node = collections.defaultdict(list)
for i in bridge_ids:
    for p in (road_recs[i]['pts'][0], road_recs[i]['pts'][-1]):
        by_node[p].append(i)
changed = True
while changed:
    changed = False
    for p, lst in by_node.items():
        if any(i in elev for i in lst):
            for i in lst:
                if i not in elev and road_recs[i]['layer'] >= 1:
                    elev[i] = True
                    changed = True
# steps / short ramps that touch an elevated footbridge act as ramps
elev_nodes = collections.defaultdict(float)
for i in elev:
    r = road_recs[i]
    H = max(1, r['layer']) * (6.0 if r['cls'] <= DRIVABLE_MAX or r['cls'] == 30 else 5.2)
    r['H'] = H
    for p in r['pts']:
        elev_nodes[p] = max(elev_nodes[p], H)
# graph distances inside each elevated component to ground contacts
adj = collections.defaultdict(list)
for i in elev:
    pts = road_recs[i]['pts']
    for a, b in zip(pts[:-1], pts[1:]):
        dd = math.hypot(a[0] - b[0], a[1] - b[1])
        adj[a].append((b, dd))
        adj[b].append((a, dd))
import heapq
dist = {}
pq = []
for p in elev_nodes:
    if p in ground_nodes:
        dist[p] = 0.0
        pq.append((0.0, p))
heapq.heapify(pq)
while pq:
    dcur, p = heapq.heappop(pq)
    if dcur > dist.get(p, 1e18):
        continue
    for q, dd in adj[p]:
        nd = dcur + dd
        if nd < dist.get(q, 1e18):
            dist[q] = nd
            heapq.heappush(pq, (nd, q))
# components -> ramp length
seen = set()
node_h = {}
for start in list(elev_nodes.keys()):
    if start in seen:
        continue
    comp = []
    stack = [start]
    seen.add(start)
    while stack:
        p = stack.pop()
        comp.append(p)
        for q, _ in adj[p]:
            if q not in seen:
                seen.add(q)
                stack.append(q)
    dmax = max((dist.get(p, 1e9) for p in comp), default=0)
    if dmax >= 1e8:           # never touches the ground inside the world: fully elevated
        for p in comp:
            node_h[p] = elev_nodes[p]
        continue
    ramp = max(8.0, min(75.0, 0.85 * dmax))
    for p in comp:
        tt = min(1.0, dist.get(p, 0) / ramp)
        s = tt * tt * (3 - 2 * tt)
        node_h[p] = elev_nodes[p] * s
print('elevated bridge ways', len(elev), 'of', len(bridge_ids))

# ---- clip to disc, simplify, pack
junctions = []
for k, n in node_use.items():
    if n >= 3 and k[0] * k[0] + k[1] * k[1] < RW * RW:
        junctions.append((k[0], k[1], node_w.get(k, 6) * 0.5 + 2.5))

road_out = bytearray()
n_roads = 0
road_geo = []   # for tree placement / poi street lookup: (LineString, cls, width, name)
for ri, r in enumerate(road_recs):
    ls = LineString(r['pts'])
    has_h = ri in elev
    parts = lines_of(ls.intersection(disc)) if not disc.contains(ls) else [ls]
    for part in parts:
        if part.length < 1.0:
            continue
        if has_h:
            coords = list(part.coords)        # keep nodes so heights map
        else:
            coords = list(part.simplify(0.25, preserve_topology=False).coords)
        if len(coords) < 2:
            continue
        # split very long hops so int16 deltas hold
        out = [coords[0]]
        for c in coords[1:]:
            a = out[-1]
            seg = math.hypot(c[0] - a[0], c[1] - a[1])
            nsub = int(seg // 2500) + 1
            for s in range(1, nsub + 1):
                out.append((a[0] + (c[0] - a[0]) * s / nsub, a[1] + (c[1] - a[1]) * s / nsub))
        coords = out
        flags = r['flags'] | (32 if has_h else 0)
        road_out += struct.pack('<BBBbBHH', r['cls'], min(255, dm(r['width'])), flags, max(-3, min(6, r['layer'])),
                                min(255, r['lanes']), names.get(r['name']), len(coords))
        x0, z0 = dm(coords[0][0]), dm(-coords[0][1])
        road_out += struct.pack('<ii', x0, z0)
        px, pz = x0, z0
        for c in coords[1:]:
            x, z = dm(c[0]), dm(-c[1])
            road_out += struct.pack('<hh', x - px, z - pz)
            px, pz = x, z
        if has_h:
            for c in coords:
                key = (round(c[0], 2), round(c[1], 2))
                h = node_h.get(key)
                if h is None:   # clipped point: nearest original node
                    h = min(((math.hypot(c[0] - q[0], c[1] - q[1]), node_h.get(q, 0)) for q in r['pts']), default=(0, 0))[1]
                road_out += struct.pack('<B', min(255, int(round(h * 4))))
        n_roads += 1
        road_geo.append((LineString(coords), r['cls'], r['width'], r['name'], has_h))
print('roads packed', n_roads, 'bytes', len(road_out), 'junctions', len(junctions))

# --------------------------------------------------------------------------- land / sea
coast = [w for w in ways if w['t'].get('natural') == 'coastline']
segs = {tuple(w['p'][0]): w for w in coast}
ends = {tuple(w['p'][-1]) for w in coast}
starts = [k for k in segs if k not in ends]
land = disc
if starts:
    chain = []
    cur = starts[0]
    while cur in segs:
        w = segs.pop(cur)
        chain.extend(w['p'] if not chain else w['p'][1:])
        cur = tuple(w['p'][-1])
    print('coast chain pts', len(chain), chain[0], chain[-1])
    # extend both ends outward so the line fully crosses the disc
    def extend(p, q, far=3000):
        dx, dy = p[0] - q[0], p[1] - q[1]
        L = math.hypot(dx, dy) or 1
        return (p[0] + dx / L * far, p[1] + dy / L * far)
    line = LineString([extend(chain[0], chain[1])] + chain + [extend(chain[-1], chain[-2])])
    pieces = polys_of(split(disc, line))
    pieces.sort(key=lambda p: p.distance(Point(0, 0)))
    land = pieces[0]
    print('land pieces', len(pieces), 'land area km2', round(land.area / 1e6, 2), 'of', round(disc.area / 1e6, 2))
coast_line = LineString(chain) if starts else None

# --------------------------------------------------------------------------- areas
A_WATER, A_POOL, A_SAND, A_PARK, A_GRASS, A_WOOD, A_PITCH, A_PLAY, A_PARKING, A_PLAZA, A_DIRT, A_CEM, A_PIER, A_ROCK, A_COURT = range(1, 16)


def area_class(t):
    nat, lu, le, am, mm = t.get('natural'), t.get('landuse'), t.get('leisure'), t.get('amenity'), t.get('man_made')
    if 'building' in t or 'building:part' in t:
        return None
    if nat == 'water' or t.get('water') or lu in ('reservoir', 'basin') or t.get('waterway') in ('riverbank', 'dock'):
        return A_WATER
    if le == 'swimming_pool':
        return A_POOL
    if nat in ('beach', 'sand'):
        return A_SAND
    if le in ('park', 'garden', 'dog_park', 'nature_reserve') or lu in ('recreation_ground', 'village_green'):
        return A_PARK
    if lu in ('grass', 'meadow', 'greenfield', 'allotments', 'plant_nursery', 'farmland', 'flowerbed') or nat in ('grassland', 'heath') or le in ('golf_course', 'common'):
        return A_GRASS
    if nat in ('wood', 'scrub', 'tree_group') or lu == 'forest':
        return A_WOOD
    if le in ('pitch', 'track'):
        sp = t.get('sport', '')
        if any(s in sp for s in ('tennis', 'basketball', 'netball', 'badminton', 'volleyball', 'futsal', 'multi', 'skateboard', 'pickleball')) or t.get('surface') in ('acrylic', 'concrete', 'asphalt', 'tartan', 'paved'):
            return A_COURT
        return A_PITCH
    if le == 'playground':
        return A_PLAY
    if am == 'parking' and t.get('parking') in (None, 'surface', 'street_side', 'lane'):
        return A_PARKING
    if t.get('highway') in ('pedestrian', 'footway') or t.get('place') == 'square':
        return A_PLAZA
    if lu in ('construction', 'brownfield'):
        return A_DIRT
    if lu == 'cemetery' or am == 'grave_yard':
        return A_CEM
    if mm == 'pier':
        return A_PIER
    if mm in ('breakwater', 'groyne') or nat in ('bare_rock', 'shingle'):
        return A_ROCK
    return None


area_recs = []   # (cls, polygon)
zone_recs = []   # (kind, name, polygon) landuse zones for heuristics
for a in areas:
    t = a['t']
    cls = area_class(t)
    lu = t.get('landuse')
    if cls is None:
        if lu in ('residential', 'commercial', 'retail', 'industrial', 'religious', 'military', 'education') or t.get('amenity') in ('school', 'college', 'university'):
            for g in a['g']:
                for p in mkpoly(g):
                    zone_recs.append((lu or 'education', t.get('name', ''), p))
        continue
    for g in a['g']:
        for p in mkpoly(g):
            if p.area < 12:
                continue
            c = p.intersection(disc) if not disc.contains(p) else p
            for q in polys_of(c):
                q = q.simplify(0.4)
                for qq in polys_of(q):
                    if qq.area >= 12:
                        area_recs.append((cls, qq, t.get('name', ''), t.get('sport', '')))
print('areas', len(area_recs), collections.Counter(a[0] for a in area_recs).most_common())


def pack_ring(buf, ring):
    """ring: list of (x,y) metres (closed or not) -> u16 n, i32 x0,z0, i16 deltas."""
    pts = list(ring)
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts = pts[:-1]
    # split long edges for int16 deltas
    out = [pts[0]]
    for c in pts[1:]:
        a = out[-1]
        seg = math.hypot(c[0] - a[0], c[1] - a[1])
        nsub = int(seg // 2500) + 1
        for s in range(1, nsub + 1):
            out.append((a[0] + (c[0] - a[0]) * s / nsub, a[1] + (c[1] - a[1]) * s / nsub))
    pts = out
    buf += struct.pack('<H', len(pts))
    x0, z0 = dm(pts[0][0]), dm(-pts[0][1])
    buf += struct.pack('<ii', x0, z0)
    px, pz = x0, z0
    for c in pts[1:]:
        x, z = dm(c[0]), dm(-c[1])
        buf += struct.pack('<hh', x - px, z - pz)
        px, pz = x, z
    return len(pts)


def pack_poly(buf, poly, head):
    rings = [list(poly.exterior.coords)] + [list(r.coords) for r in poly.interiors if len(r.coords) >= 4]
    buf += head + struct.pack('<B', min(255, len(rings)))
    for r in rings[:255]:
        pack_ring(buf, r)


area_out = bytearray()
area_recs.sort(key=lambda a: a[0])
for cls, p, nm, sp in area_recs:
    pack_poly(area_out, p, struct.pack('<B', cls))
land_out = bytearray()
land_polys = polys_of(land.simplify(1.0))
for p in land_polys:
    pack_poly(land_out, p, b'')
print('area bytes', len(area_out), 'land polys', len(land_polys), 'bytes', len(land_out))

# --------------------------------------------------------------------------- buildings
K_BLOCK, K_SHOP, K_TERRACE, K_HOUSE, K_FLAT, K_COMM, K_IND, K_CANOPY, K_SPECIAL, K_SCHOOL, K_TOWER, K_ROWBLOCK = range(12)

bl_raw = []   # (poly, tags, is_part)
for a in areas:
    t = a['t']
    is_b = 'building' in t and t['building'] not in ('no',)
    is_p = 'building:part' in t and t['building:part'] not in ('no',)
    if not (is_b or is_p):
        continue
    if t.get('location') == 'underground' or (pint(t.get('layer'), 0) or 0) < 0 and t.get('building') in ('train_station', 'yes') and 'building:levels' not in t:
        continue
    for g in a['g']:
        for p in mkpoly(g):
            if p.area < 6:
                continue
            c = p.centroid
            if c.x * c.x + c.y * c.y > RW * RW:
                continue
            bl_raw.append((p, t, is_p and not is_b, a['id']))
print('building polygons', len(bl_raw))

polys = [b[0] for b in bl_raw]
btree = STRtree(polys)

# which outlines are (mostly) covered by building:part geometry
part_area = collections.Counter()
for i, (p, t, is_part, _) in enumerate(bl_raw):
    if not is_part:
        continue
    c = p.representative_point()
    for j in btree.query(c):
        if not bl_raw[j][2] and polys[j].contains(c):
            part_area[j] += p.area
skip_outline = {j for j, ar in part_area.items() if ar >= 0.6 * polys[j].area}
print('outlines replaced by parts', len(skip_outline))

# road tree for facade orientation
front_roads = [(g, cls, w, nm) for (g, cls, w, nm, hh) in road_geo if cls <= 14 and not hh]
froad_tree = STRtree([r[0] for r in front_roads])

zone_tree = STRtree([z[2] for z in zone_recs]) if zone_recs else None


def zone_at(pt):
    if not zone_tree:
        return None
    for j in zone_tree.query(pt):
        if zone_recs[j][2].contains(pt):
            return zone_recs[j][0]
    return None


def obb(poly):
    """oriented bbox: returns (long, short, corners[4]) with corners in order."""
    r = poly.minimum_rotated_rectangle
    if r.geom_type != 'Polygon':
        return 0, 0, None
    cs = list(r.exterior.coords)[:4]
    e0 = math.hypot(cs[1][0] - cs[0][0], cs[1][1] - cs[0][1])
    e1 = math.hypot(cs[2][0] - cs[1][0], cs[2][1] - cs[1][1])
    return max(e0, e1), min(e0, e1), cs


CONSERVATION_STREETS = {
    'Joo Chiat Road', 'Joo Chiat Place', 'Joo Chiat Terrace', 'Joo Chiat Lane', 'Koon Seng Road', 'Tembeling Road',
    'Everitt Road', 'Everitt Road North', 'Onan Road', 'Crane Road', 'Carpmael Road', 'Ceylon Road', 'East Coast Road',
    'Mangis Road', 'Marshall Road', 'Pennefather Road', 'Duku Road', 'Chapel Road', 'Fowlie Road', 'Tanjong Katong Road',
    'Geylang Road', 'Sims Avenue', 'Changi Road', 'Upper East Coast Road', 'Still Road', 'Guillemard Road', 'Lorong Bachok',
    'Lorong 24A Geylang', 'Lorong 35 Geylang', 'Lorong 34 Geylang', 'Aljunied Road', 'Kim Yam Road', 'Jalan Besar', 'Dunman Road',
    'Haig Road', 'Joo Chiat Walk', 'Rambutan Road', 'Langsat Road', 'Lorong Stangee', 'Jago Close', 'Jalan Eunos', 'Kampong Eunos'}

recs = []
levels_known = []   # (x, y, levels) for imputation of tall residential blocks
for i, (p, t, is_part, oid) in enumerate(bl_raw):
    if i in skip_outline:
        continue
    b = t.get('building') if not is_part else t.get('building:part')
    lv = pint(t.get('building:levels'))
    h = pfloat(t.get('height'))
    if h is not None and h <= 0:
        h = None
    mh = pfloat(t.get('min_height'))
    if mh is None:
        ml = pint(t.get('building:min_level'))
        mh = ml * 3.3 if ml else 0
    area = p.area
    lng, sht, corners = obb(p)
    rect = area / (lng * sht) if lng * sht > 0 else 0
    c = p.centroid
    recs.append(dict(i=i, p=p, t=t, b=b, lv=lv, h=h, mh=mh or 0, area=area, lng=lng, sht=sht, rect=rect, cx=c.x, cy=c.y,
                     part=is_part, oid=oid))
    if lv and lv >= 5 and b in ('residential', 'apartments', 'yes', 'dormitory'):
        levels_known.append((c.x, c.y, lv))

lk_tree = STRtree([Point(x, y) for x, y, _ in levels_known]) if levels_known else None


def impute_levels(x, y):
    if not lk_tree:
        return 12
    cand = lk_tree.query(Point(x, y).buffer(320))
    vals = sorted(levels_known[j][2] for j in cand)
    if not vals:
        return 12
    return vals[len(vals) // 2]


def nearest_road(pt, maxd=60):
    best = None
    for j in froad_tree.query(pt.buffer(maxd)):
        g, cls, w, nm = front_roads[j]
        dd = g.distance(pt)
        if best is None or dd < best[0]:
            best = (dd, j)
    return best


def front_edge(poly, prefer_short, want_name=None):
    """index of the exterior edge that faces the nearest road."""
    ext = list(poly.exterior.coords)
    n = len(ext) - 1
    cands = set(froad_tree.query(poly.buffer(45)))
    if not cands:
        return None, None
    best = None
    for k in range(n):
        a, b2 = ext[k], ext[k + 1]
        L = math.hypot(b2[0] - a[0], b2[1] - a[1])
        if L < 2.2:
            continue
        mx, my = (a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2
        # outward normal (ring is CCW after orient) -> point a little outside
        nx, ny = (b2[1] - a[1]) / L, -(b2[0] - a[0]) / L
        probe = Point(mx + nx * 1.0, my + ny * 1.0)
        if poly.contains(probe):
            nx, ny = -nx, -ny
            probe = Point(mx + nx * 1.0, my + ny * 1.0)
        for j in cands:
            g, cls, w, nm = front_roads[j]
            dd = g.distance(probe)
            if dd > 40:
                continue
            # the road must lie on the outward side and be roughly parallel to the edge
            q = g.interpolate(g.project(probe))
            vx, vy = q.x - mx, q.y - my
            if vx * nx + vy * ny < 0.5:
                continue
            q2 = g.interpolate(min(g.length, g.project(probe) + 2.0))
            q1 = g.interpolate(max(0, g.project(probe) - 2.0))
            rx, ry = q2.x - q1.x, q2.y - q1.y
            rl = math.hypot(rx, ry) or 1
            par = abs((rx * (b2[0] - a[0]) + ry * (b2[1] - a[1])) / (rl * L))
            if par < 0.6:
                continue
            score = dd + (0 if cls <= 12 else 12) - (6 if want_name and nm == want_name else 0)
            if prefer_short is True:
                score += L * 0.25
            elif prefer_short is False:
                score -= min(L, 60) * 0.15
            if best is None or score < best[0]:
                best = (score, k, j, dd)
    if best is None:
        return None, None
    return best[1], front_roads[best[2]]


from shapely.geometry.polygon import orient

b_out = bytearray()
b_meta = []          # per building: [hnIdx, streetIdx, nameIdx, btypeIdx]
hn_tab, st_tab, nm_tab, bt_tab = StrTab(), StrTab(), StrTab(), StrTab()
geo_index = []       # for places pipeline
kind_count = collections.Counter()
final = []

for r in recs:
    p, t, b = r['p'], r['t'], r['b']
    area, lng, sht, rect = r['area'], r['lng'], r['sht'], r['rect']
    lv, h = r['lv'], r['h']
    pt = Point(r['cx'], r['cy'])
    kind = K_BLOCK
    aspect = lng / sht if sht > 0 else 1
    rel = t.get('religion') or ''
    am = t.get('amenity') or ''
    is_canopy = b in ('roof', 'carport', 'canopy', 'shelter') or t.get('building:part') == 'roof' or am == 'shelter' or t.get('man_made') == 'canopy'
    rowunit = (not r['part'] and not is_canopy and 40 <= area <= 460 and rect > 0.8 and aspect >= 1.9 and 3.3 <= sht <= 9.8
               and (lv is None or lv <= 4) and (h is None or h <= 16) and b in ('yes', 'commercial', 'retail', 'residential', 'terrace', 'house', 'apartments', 'semidetached_house', 'shop', 'office'))
    if is_canopy:
        kind = K_CANOPY
    elif b in ('temple', 'church', 'mosque', 'cathedral', 'chapel', 'shrine', 'synagogue', 'religious', 'monastery') or am == 'place_of_worship':
        kind = K_SPECIAL
    elif rowunit:
        kind = K_TERRACE
    elif b in ('house', 'detached', 'semidetached_house', 'bungalow', 'terrace', 'villa') and (lv is None or lv <= 4):
        kind = K_HOUSE
    elif b in ('industrial', 'warehouse', 'hangar', 'service', 'garage', 'garages', 'manufacture', 'data_center', 'utility', 'transformer_tower', 'shed'):
        kind = K_IND
    elif b in ('school', 'kindergarten', 'college', 'university', 'public', 'civic', 'government', 'hospital', 'sports_centre', 'stadium', 'grandstand', 'train_station', 'transportation', 'fire_station', 'library', 'community_centre', 'sports_hall'):
        kind = K_SCHOOL
    elif b in ('hotel', 'office') or t.get('tourism') == 'hotel' or t.get('office'):
        kind = K_TOWER if (lv or 0) >= 7 or (h or 0) >= 24 else K_COMM
    elif b in ('commercial', 'retail', 'supermarket', 'shop', 'kiosk', 'parking', 'mall') or t.get('shop'):
        kind = K_TOWER if (lv or 0) >= 12 else K_COMM
    elif b in ('apartments', 'residential', 'dormitory', 'condominium'):
        kind = K_FLAT if ((lv or 0) >= 5 or area > 520 or (h or 0) > 15) else K_HOUSE
    else:   # building=yes and friends
        z = zone_at(pt)
        if lv is not None and lv >= 5:
            kind = K_FLAT if z in (None, 'residential') else (K_TOWER if lv >= 10 else K_COMM)
        elif h is not None and h >= 16:
            kind = K_FLAT if z in (None, 'residential') else K_COMM
        elif area <= 520:
            kind = K_HOUSE if z in (None, 'residential') else (K_IND if z == 'industrial' else K_COMM if z in ('commercial', 'retail') else K_HOUSE)
        else:
            if z == 'industrial':
                kind = K_IND
            elif z in ('commercial', 'retail'):
                kind = K_COMM
            elif z in ('education', 'religious', 'military'):
                kind = K_SCHOOL
            else:
                # big anonymous footprint: slab block if elongated, otherwise low commercial/civic
                kind = K_FLAT if (aspect >= 2.6 and sht <= 30) or (lv or 0) >= 5 else K_COMM

    # ---- row units / row blocks: find the street front
    fe = None
    arcade = 0
    street = t.get('addr:street') or ''
    froad = None
    if kind == K_TERRACE:
        fe, froad = front_edge(orient(p), True, street)
        if fe is None:
            kind = K_HOUSE
        else:
            fcls = froad[1]
            fname = froad[3]
            commercial_front = (fname in CONSERVATION_STREETS or street in CONSERVATION_STREETS or b in ('commercial', 'retail', 'shop'))
            if commercial_front and fcls <= 12:
                kind = K_SHOP
                arcade = 1
    elif kind in (K_COMM, K_BLOCK, K_HOUSE) and not r['part'] and 280 <= area <= 3200 and rect > 0.72 and 9 <= sht <= 36 and (lv is None or lv <= 4) and b in ('yes', 'commercial', 'retail', 'shop', 'residential', 'terrace', 'apartments'):
        fe0, froad0 = front_edge(orient(p), False, street)
        if fe0 is not None and (froad0[3] in CONSERVATION_STREETS or street in CONSERVATION_STREETS) and froad0[1] <= 12:
            ext = list(orient(p).exterior.coords)
            L = math.hypot(ext[fe0 + 1][0] - ext[fe0][0], ext[fe0 + 1][1] - ext[fe0][1])
            if L >= 9:
                kind = K_ROWBLOCK
                fe, froad = fe0, froad0
                arcade = 1

    # ---- height
    if h is None:
        if lv is None:
            if kind in (K_SHOP, K_TERRACE, K_ROWBLOCK):
                lv = 2 if (r['oid'] * 2654435761 % 100) < 78 else 3
            elif kind == K_HOUSE:
                lv = 2 if area < 380 else 3
            elif kind == K_FLAT:
                lv = impute_levels(r['cx'], r['cy'])
            elif kind == K_COMM:
                lv = 2 if area < 400 else 4
            elif kind == K_TOWER:
                lv = 14
            elif kind == K_IND:
                lv = 2 if area < 1500 else 3
            elif kind == K_SCHOOL:
                lv = 1 if b == 'train_station' else 4
            elif kind == K_SPECIAL:
                lv = 2
            elif kind == K_CANOPY:
                lv = 1
            else:
                lv = 2
        per = {K_SHOP: 3.9, K_TERRACE: 3.5, K_ROWBLOCK: 3.9, K_HOUSE: 3.3, K_FLAT: 2.95, K_COMM: 4.4, K_TOWER: 3.9,
               K_IND: 5.0, K_SCHOOL: 3.8, K_SPECIAL: 4.5, K_CANOPY: 3.6, K_BLOCK: 3.4}[kind]
        h = max(2.6, lv * per + (0.6 if kind in (K_FLAT, K_COMM, K_TOWER) else 0))
    else:
        if lv is None:
            lv = max(1, int(round(h / 3.3)))
    if kind == K_CANOPY:
        if r['mh'] <= 0:
            r['mh'] = max(2.4, h - 0.35)
        h = max(h, r['mh'] + 0.3)
    h = min(h, 290.0)

    # ---- simplify + orient
    q = p.simplify(0.18)
    qs = polys_of(q) or [p]
    q = max(qs, key=lambda g: g.area)
    q = orient(q)   # exterior CCW in (x east, y north)
    if kind in (K_SHOP, K_TERRACE, K_ROWBLOCK):
        fe, froad2 = front_edge(q, kind != K_ROWBLOCK, street)
        if fe is None:
            kind = K_HOUSE if kind != K_ROWBLOCK else K_COMM
            arcade = 0
    # ---- inset (hip-like) roof ring for houses / special / terraces without front
    inset = None
    rise = 0
    if kind in (K_HOUSE, K_SPECIAL) and len(q.interiors) == 0 and q.area > 30:
        dd = min(sht * 0.36, 3.6)
        try:
            ins = polys_of(q.buffer(-dd, join_style=2))
        except Exception:
            ins = []
        if len(ins) == 1 and ins[0].area > 2 and len(ins[0].interiors) == 0:
            inset = orient(ins[0].simplify(0.2))
            rise = dd * (0.55 if kind == K_HOUSE else 0.75)
    flags = (1 if arcade else 0) | (2 if inset is not None else 0) | (4 if r['part'] else 0)
    hn = t.get('addr:housenumber') or ''
    name = t.get('name') or t.get('name:en') or ''
    seed = (r['oid'] * 2654435761 >> 7) & 0xFF
    rec = dict(kind=kind, lv=min(255, lv or 1), h=h, mh=r['mh'], fe=fe if fe is not None else 255, flags=flags, seed=seed,
               poly=q, inset=inset, rise=rise, hn=hn, st=street, name=name, b=b or '', cx=r['cx'], cy=r['cy'], oid=r['oid'],
               rel=rel, tags=t)
    final.append(rec)
    kind_count[kind] += 1

print('buildings final', len(final), dict(kind_count))

# sort into tiles
tiles = collections.defaultdict(list)
for rec in final:
    tiles[tile_of(rec['cx'], rec['cy'])].append(rec)
tile_keys = sorted(tiles.keys(), key=lambda k: ((k[0] + 0.5) ** 2 + (k[1] + 0.5) ** 2))
tile_index = []
bi = 0
all_b = []
for tk in tile_keys:
    lst = tiles[tk]
    start = bi
    for rec in lst:
        q = rec['poly']
        rings = [list(q.exterior.coords)] + [list(rr.coords) for rr in q.interiors if len(rr.coords) >= 4]
        rings = rings[:250]
        relc = {'muslim': 1, 'hindu': 2, 'buddhist': 3, 'taoist': 3, 'chinese_folk': 3, 'christian': 4, 'sikh': 5}.get(rec['rel'], 0)
        b_out += struct.pack('<BBHHBBBBB', rec['kind'], rec['lv'], min(65535, dm(rec['h'])), min(65535, dm(rec['mh'])),
                             rec['fe'] if rec['fe'] < 255 else 255, rec['flags'], rec['seed'], relc, len(rings))
        for rg in rings:
            pack_ring(b_out, rg)
        if rec['inset'] is not None:
            b_out += struct.pack('<B', min(255, dm(rec['rise'])))
            pack_ring(b_out, list(rec['inset'].exterior.coords))
        b_meta.append((hn_tab.get(rec['hn']), st_tab.get(rec['st']), nm_tab.get(rec['name']), bt_tab.get(rec['b'])))
        rec['idx'] = bi
        all_b.append(rec)
        bi += 1
    tile_index.append([tk[0], tk[1], start, bi - start])
print('building bytes', len(b_out), 'tiles', len(tile_index))

# --------------------------------------------------------------------------- trees
print('placing trees ...')
bpolys = [rec['poly'] for rec in all_b]
bt2 = STRtree(bpolys)
road_lines = [(g, cls, w) for (g, cls, w, nm, hh) in road_geo if cls <= 20 and not hh]
rt2 = STRtree([r[0] for r in road_lines])
water_polys = [a[1] for a in area_recs if a[0] in (A_WATER, A_POOL)]
hard_polys = [a[1] for a in area_recs if a[0] in (A_PITCH, A_COURT, A_PLAY, A_PARKING, A_PLAZA, A_SAND, A_PIER, A_ROCK)]
wt = STRtree(water_polys) if water_polys else None
ht = STRtree(hard_polys) if hard_polys else None
land_prep = land


def blocked(x, y, clear_b=2.2, road_margin=0.6):
    pt = Point(x, y)
    if x * x + y * y > (RW - 8) ** 2:
        return True
    for j in bt2.query(pt.buffer(clear_b)):
        if bpolys[j].distance(pt) < clear_b:
            return True
    for j in rt2.query(pt.buffer(16)):
        g, cls, w = road_lines[j]
        if g.distance(pt) < w / 2 + road_margin:
            return True
    if wt is not None:
        for j in wt.query(pt):
            if water_polys[j].contains(pt):
                return True
    return False


trees = []   # (x, y, type, scale)
T_RAIN, T_PALM, T_SMALL, T_CASU = 0, 1, 2, 3
tree_grid = collections.defaultdict(list)


def too_close(x, y, dmin):
    gx, gy = int(x // 8), int(y // 8)
    for ax in (gx - 1, gx, gx + 1):
        for ay in (gy - 1, gy, gy + 1):
            for (tx, ty) in tree_grid[(ax, ay)]:
                if (tx - x) ** 2 + (ty - y) ** 2 < dmin * dmin:
                    return True
    return False


def add_tree(x, y, typ, scale):
    trees.append((x, y, typ, scale))
    tree_grid[(int(x // 8), int(y // 8))].append((x, y))


def coast_dist(x, y):
    return coast_line.distance(Point(x, y)) if coast_line is not None else 1e9


# 1) mapped trees
for n in nodes:
    if n['t'].get('natural') == 'tree':
        x, y = n['x'], n['y']
        if x * x + y * y < (RW - 8) ** 2 and not too_close(x, y, 3):
            add_tree(x, y, T_PALM if 'palm' in (n['t'].get('species', '') + n['t'].get('genus', '') + n['t'].get('leaf_type', '')).lower() else T_RAIN, 0.8 + random.random() * 0.5)
# 2) street trees
for (g, cls, w, nm, hh) in road_geo:
    if hh or cls not in (4, 6, 8, 10, 11, 2):
        continue
    L = g.length
    if L < 26:
        continue
    step = 17.0 if cls in (4, 6, 2) else 19.0 if cls == 8 else 25.0
    s = 9 + random.random() * 6
    while s < L - 9:
        pnt = g.interpolate(s)
        p2 = g.interpolate(min(L, s + 1.0))
        dx, dy = p2.x - pnt.x, p2.y - pnt.y
        ll = math.hypot(dx, dy) or 1
        nx, ny = -dy / ll, dx / ll
        for side in (1, -1):
            if random.random() < 0.22:
                continue
            off = w / 2 + 2.3 + random.random() * 0.8
            x, y = pnt.x + nx * off * side, pnt.y + ny * off * side
            if not land_prep.contains(Point(x, y)):
                continue
            if too_close(x, y, 6.5) or blocked(x, y, 1.6, 0.9):
                continue
            near_sea = coast_dist(x, y) < 330
            typ = T_PALM if (near_sea and random.random() < 0.35) else (T_SMALL if cls in (10, 11) and random.random() < 0.45 else T_RAIN)
            add_tree(x, y, typ, 0.75 + random.random() * 0.55)
        s += step * (0.75 + random.random() * 0.5)
print('  street trees so far', len(trees))
# 3) parks / woods / grass
dens = {A_PARK: 1 / 520.0, A_WOOD: 1 / 210.0, A_GRASS: 1 / 1100.0, A_CEM: 1 / 900.0}
for cls, p, nm, sp in area_recs:
    if cls not in dens:
        continue
    n_try = int(p.area * dens[cls])
    if n_try < 1:
        n_try = 1 if random.random() < p.area * dens[cls] else 0
    minx, miny, maxx, maxy = p.bounds
    placed = 0
    tries = 0
    while placed < n_try and tries < n_try * 6:
        tries += 1
        x = minx + random.random() * (maxx - minx)
        y = miny + random.random() * (maxy - miny)
        pt = Point(x, y)
        if not p.contains(pt):
            continue
        if too_close(x, y, 5.0 if cls == A_WOOD else 7.0) or blocked(x, y, 2.5, 1.2):
            continue
        if ht is not None and any(hard_polys[j].contains(pt) for j in ht.query(pt)):
            continue
        cd = coast_dist(x, y)
        if cd < 120:
            typ = T_PALM if random.random() < 0.6 else T_CASU
        elif cd < 380:
            typ = random.choice([T_PALM, T_CASU, T_RAIN, T_RAIN])
        else:
            typ = T_RAIN if random.random() < 0.7 else T_SMALL
        add_tree(x, y, typ, 0.8 + random.random() * 0.6)
        placed += 1
print('trees total', len(trees), collections.Counter(t[2] for t in trees))

tree_tiles = collections.defaultdict(list)
for (x, y, typ, sc) in trees:
    tree_tiles[tile_of(x, y)].append((x, y, typ, sc))
t_out = bytearray()
tree_index = []
for tk in sorted(tree_tiles.keys()):
    lst = tree_tiles[tk]
    ox, oz = tk[0] * TILE, tk[1] * TILE
    tree_index.append([tk[0], tk[1], len(lst)])
    for (x, y, typ, sc) in lst:
        t_out += struct.pack('<HHB', max(0, min(65535, dm(x - ox))), max(0, min(65535, dm(-y - oz))), (typ & 3) | (min(63, int(sc * 32)) << 2))

# --------------------------------------------------------------------------- write
def b64(b):
    return base64.b64encode(bytes(b)).decode('ascii')


j_out = bytearray()
for (x, y, rad) in junctions:
    j_out += struct.pack('<iiB', dm(x), dm(-y), min(255, dm(rad)))

meta_arr = bytearray()
for m in b_meta:
    meta_arr += struct.pack('<HHHB', min(65535, m[0]), min(65535, m[1]), min(65535, m[2]), min(255, m[3]))

world = {
    'v': 1,
    'origin': {'lat': raw['lat0'], 'lon': raw['lon0'], 'kx': raw['kx'], 'ky': raw['ky'], 'name': 'Starbucks Katong Square'},
    'radius': RW, 'tile': TILE,
    'names': names.items,
    'roads': {'n': n_roads, 'b64': b64(road_out)},
    'junctions': {'n': len(junctions), 'b64': b64(j_out)},
    'areas': {'n': len(area_recs), 'b64': b64(area_out)},
    'land': {'n': len(land_polys), 'b64': b64(land_out)},
    'buildings': {'n': len(all_b), 'b64': b64(b_out), 'tiles': tile_index, 'meta': b64(meta_arr),
                  'hn': hn_tab.items, 'st': st_tab.items, 'nm': nm_tab.items, 'bt': bt_tab.items},
    'trees': {'n': len(trees), 'b64': b64(t_out), 'tiles': tree_index},
}
js = 'window.KD_WORLD=' + json.dumps(world, separators=(',', ':'), ensure_ascii=False) + ';\n'
open(OUTDIR + '/world.js', 'w', encoding='utf8').write(js)
print('world.js', round(len(js) / 1e6, 2), 'MB')

# intermediate index for the places pipeline
gi = {
    'buildings': [dict(idx=r['idx'], kind=r['kind'], lv=r['lv'], h=round(r['h'], 1), hn=r['hn'], st=r['st'], name=r['name'], b=r['b'],
                       cx=round(r['cx'], 1), cy=round(r['cy'], 1), ring=[(round(x, 1), round(y, 1)) for x, y in r['poly'].exterior.coords],
                       pc=r['tags'].get('addr:postcode', '')) for r in all_b],
    'roads': [dict(name=nm, cls=cls, w=round(w, 1), pts=[(round(x, 1), round(y, 1)) for x, y in g.coords]) for (g, cls, w, nm, hh) in road_geo if nm and cls <= 14],
}
json.dump(gi, open(OUTDIR + '/geo_index.json', 'w'))
print('done')
