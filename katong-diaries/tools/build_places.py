#!/usr/bin/env python3
"""Pass 3b: merge OpenStreetMap places, the hand-researched hot spots and mall
directories into data/places.js.

usage: build_places.py RAW_JSON GEO_INDEX POIS_OSM MALLS_SINGMALLS MALLS_OFFICIAL TOOLS_DIR OUT_JS CACHE_JSON
"""
import json, math, sys, re, os, time, collections, hashlib, urllib.request, urllib.parse
from shapely.geometry import Polygon, Point, LineString
from shapely.strtree import STRtree

RAW, GEO, POIS, M_SM, M_OFF, TOOLS, OUT, CACHE = sys.argv[1:9]
raw = json.load(open(RAW))
LAT0, LON0, KX, KY = raw['lat0'], raw['lon0'], raw['kx'], raw['ky']
geo = json.load(open(GEO))
osm = json.load(open(POIS))
RW = 5000.0


def norm(s):
    return re.sub(r'[^a-z0-9]', '', (s or '').lower())


def norm_street(s):
    s = (s or '').lower().strip()
    s = re.sub(r'\brd\b\.?', 'road', s)
    s = re.sub(r'\bave\b\.?', 'avenue', s)
    s = re.sub(r'\bst\b\.?', 'street', s)
    s = re.sub(r'\bjln\b\.?', 'jalan', s)
    s = re.sub(r'\blor\b\.?', 'lorong', s)
    return re.sub(r'[^a-z0-9]', '', s)


# ---------------------------------------------------------------- building + road indexes
B = geo['buildings']
bpoly = [Polygon(b['ring']) if len(b['ring']) >= 4 else Point(b['cx'], b['cy']).buffer(2) for b in B]
btree = STRtree(bpoly)
addr_idx = collections.defaultdict(list)
street_b = collections.defaultdict(list)
name_idx = collections.defaultdict(list)
for i, b in enumerate(B):
    if b['hn'] and b['st']:
        for hn in re.split(r'[;,/]', b['hn']):
            addr_idx[(hn.strip().upper(), norm_street(b['st']))].append(i)
        street_b[norm_street(b['st'])].append(i)
    if b['name']:
        name_idx[norm(b['name'])].append(i)
roads = geo['roads']
road_lines = [LineString(r['pts']) for r in roads]
rtree = STRtree(road_lines)
road_by_name = collections.defaultdict(list)
for i, r in enumerate(roads):
    road_by_name[norm_street(r['name'])].append(i)

cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}


def onemap(q):
    if q in cache:
        return cache[q]
    url = 'https://www.onemap.gov.sg/api/common/elastic/search?' + urllib.parse.urlencode(
        {'searchVal': q, 'returnGeom': 'Y', 'getAddrDetails': 'Y', 'pageNum': 1})
    res = None
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (map-builder)'})
        with urllib.request.urlopen(req, timeout=25) as f:
            d = json.loads(f.read().decode('utf8'))
        if d.get('results'):
            r0 = d['results'][0]
            res = {'lat': float(r0['LATITUDE']), 'lon': float(r0['LONGITUDE']), 'blk': r0.get('BLK_NO'), 'road': r0.get('ROAD_NAME'),
                   'bld': r0.get('BUILDING'), 'pc': r0.get('POSTAL')}
    except Exception as e:
        print('  onemap fail', q, e)
        return None
    cache[q] = res
    json.dump(cache, open(CACHE, 'w'))
    time.sleep(0.35)
    return res


def ll2xy(lat, lon):
    return ((lon - LON0) * KX, (lat - LAT0) * KY)


def geocode(e):
    """-> (x, y, method)"""
    if 'xy' in e:
        return e['xy'][0], e['xy'][1], 'manual'
    if 'x2' in e:
        a, b2 = e['x2']
        best = None
        for i in road_by_name.get(norm_street(a), []):
            for j in road_by_name.get(norm_street(b2), []):
                d = road_lines[i].distance(road_lines[j])
                if best is None or d < best[0]:
                    from shapely.ops import nearest_points
                    p, q = nearest_points(road_lines[i], road_lines[j])
                    best = (d, (p.x + q.x) / 2, (p.y + q.y) / 2)
        if best:
            return best[1], best[2], 'junction'
    if e.get('osm'):
        k = norm(e['osm'])
        for o in osm:
            if norm(o['n']) == k:
                return o['x'], o['y'], 'osm-name'
        for n in raw['nodes']:
            if norm(n['t'].get('name')) == k:
                return n['x'], n['y'], 'osm-node'
        for a in raw['areas']:
            if norm(a['t'].get('name')) == k and a['g']:
                o = a['g'][0]['o']
                return sum(p[0] for p in o) / len(o), sum(p[1] for p in o) / len(o), 'osm-area'
        for w in raw['ways']:
            if norm(w['t'].get('name')) == k:
                p = w['p'][len(w['p']) // 2]
                return p[0], p[1], 'osm-way'
    a = e.get('a', '')
    m = re.match(r'^\s*(\d+[A-Za-z]?)\s+(.+)$', a)
    if m:
        hn, st = m.group(1).upper(), norm_street(m.group(2))
        cands = addr_idx.get((hn, st), [])
        if not cands and re.match(r'^\d+[A-Z]$', hn):
            cands = addr_idx.get((hn[:-1], st), [])
        if cands:
            i = min(cands, key=lambda i: B[i]['cx'] ** 2 + B[i]['cy'] ** 2)
            return B[i]['cx'], B[i]['cy'], 'osm-addr'
    q = e.get('pc') or a
    if q:
        r = onemap(q + ('' if e.get('pc') else ' Singapore'))
        if r:
            x, y = ll2xy(r['lat'], r['lon'])
            road_ok = True
            if m and not e.get('pc'):
                road_ok = norm_street(r.get('road') or '') == norm_street(m.group(2))
            if road_ok and x * x + y * y < (RW + 800) ** 2:
                return x, y, 'onemap'
    if m:
        hn, st = m.group(1).upper(), norm_street(m.group(2))
        num = int(re.match(r'\d+', hn).group(0))
        best = None
        for i in street_b.get(st, []):
            mm = re.match(r'\d+', B[i]['hn'])
            if not mm:
                continue
            n2 = int(mm.group(0))
            pen = abs(n2 - num) + (0 if n2 % 2 == num % 2 else 3)
            if best is None or pen < best[0]:
                best = (pen, i)
        if best and best[0] <= 12:
            return B[best[1]]['cx'], B[best[1]]['cy'], 'near-number(%d)' % best[0]
    if e.get('in'):
        for i in name_idx.get(norm(e['in']), []):
            return B[i]['cx'], B[i]['cy'], 'building-name'
    return None


def building_at(x, y):
    pt = Point(x, y)
    for j in btree.query(pt):
        if bpoly[j].contains(pt):
            return int(j)
    return -1


def nearest_street(x, y):
    pt = Point(x, y)
    best = None
    for j in rtree.query(pt.buffer(120)):
        d = road_lines[j].distance(pt)
        if best is None or d < best[0]:
            best = (d, roads[j]['name'])
    return best[1] if best else ''


# ---------------------------------------------------------------- curated
curated = []
for fn in ('curated_food.json', 'curated_life.json'):
    curated += json.load(open(os.path.join(TOOLS, fn), encoding='utf8'))
ids = collections.Counter(e['id'] for e in curated)
dups = [k for k, v in ids.items() if v > 1]
assert not dups, dups
print('curated entries', len(curated))

report = []
places = []
used = collections.defaultdict(int)
for e in curated:
    g = geocode(e)
    if not g:
        report.append(('FAIL', e['id'], e.get('a', '')))
        continue
    x, y, how = g
    x += e.get('dx', 0)
    y += e.get('dy', 0)
    if 'dx' not in e and how not in ('manual',):
        key = (round(x), round(y))
        k = used[key]
        used[key] += 1
        if k:
            ang = k * 2.4
            x += math.cos(ang) * 7.5 * math.sqrt(k)
            y += math.sin(ang) * 7.5 * math.sqrt(k)
    report.append((how, e['id'], round(x), round(y)))
    p = {'id': e['id'], 'n': e['n'], 'c': e['c'], 's': e.get('s', ''), 'x': round(x, 1), 'z': round(-y, 1), 'hot': 1, 'b': e.get('b', '')}
    addr = e.get('a', '')
    if e.get('u'):
        addr += ', ' + e['u']
    if e.get('in'):
        addr += ' · ' + e['in']
    p['a'] = addr
    for k in ('tip', 'hrs', 'p', 't', 'src', 'mall'):
        if k in e:
            p[k] = e[k]
    if e.get('in'):
        p['in'] = e['in']
    places.append(p)

# ---------------------------------------------------------------- merge OSM
cur_by_norm = collections.defaultdict(list)
for p in places:
    cur_by_norm[norm(p['n'])].append(p)


def similar(a, b):
    a, b = norm(a), norm(b)
    if not a or not b:
        return False
    if a == b:
        return True
    if len(a) >= 6 and len(b) >= 6 and (a in b or b in a):
        return True
    return False


ctree = STRtree([Point(p['x'], -p['z']) for p in places])
kept = 0
dropped = 0
for o in osm:
    pt = Point(o['x'], o['y'])
    match = None
    for j in ctree.query(pt.buffer(220)):
        p = places[j]
        d = math.hypot(p['x'] - o['x'], -p['z'] - o['y'])
        if similar(p['n'], o['n']) and (d < 220):
            match = p
            break
    if match is not None:
        for k_src, k_dst in (('oh', 'oh'), ('w', 'w'), ('ig', 'ig')):
            if o.get(k_src) and not match.get(k_dst):
                match[k_dst] = o[k_src]
        dropped += 1
        continue
    hid = hashlib.md5((o['n'] + str(round(o['x'] / 5)) + str(round(o['y'] / 5))).encode('utf8')).hexdigest()[:7]
    p = {'id': 'o' + hid, 'n': o['n'], 'c': o['c'], 's': o['s'], 'x': o['x'], 'z': round(-o['y'], 1)}
    if o.get('a'):
        p['a'] = o['a']
    for k in ('oh', 'w', 'ig', 'halal', 'veg', 'lvl'):
        if o.get(k):
            p[k] = o[k]
    places.append(p)
    kept += 1
print('osm kept', kept, 'merged into curated', dropped)

# building link, street, address fallback
for p in places:
    bi = building_at(p['x'], -p['z'])
    if bi >= 0:
        p['bi'] = B[bi]['idx']
        if not p.get('a') and B[bi]['hn'] and B[bi]['st']:
            p['a'] = B[bi]['hn'] + ' ' + B[bi]['st']
        if not p.get('in') and B[bi]['name'] and norm(B[bi]['name']) != norm(p['n']):
            p['in'] = B[bi]['name']
    st = nearest_street(p['x'], -p['z'])
    if st:
        p['st'] = st
    a = p.get('a', '')
    if a and not re.search(r'[A-Za-z]{3}', a):
        # just a unit or number: add the street
        p['a'] = (a + ' ' + st).strip() if st else a
    if a and re.match(r'^#', a) and p.get('in'):
        p['a'] = a + ' · ' + p['in']

# unique ids
seen = set()
for p in places:
    base = p['id']
    k = 2
    while p['id'] in seen:
        p['id'] = base + str(k)
        k += 1
    seen.add(p['id'])

# ---------------------------------------------------------------- malls
def level_of(unit):
    u = (unit or '').upper()
    m = re.search(r'#?\s*(B\d|\d{2})\s*-', u)
    if not m:
        m2 = re.search(r'LEVEL\s*(\d)', u) or re.search(r'\bL(\d)\b', u)
        if m2:
            return 'L' + m2.group(1)
        if 'BASEMENT' in u:
            return 'B1'
        return '?'
    lv = m.group(1)
    if lv.startswith('B'):
        return lv
    return 'L' + str(int(lv))


def mall_cat(c, name=''):
    c = (c or '').lower()
    n = name.lower()
    if any(k in c for k in ('food', 'beverage', 'restaurant', 'cafe', 'dessert', 'bakery', 'supermarket', 'specialt')):
        return 'food'
    if any(k in c for k in ('fashion', 'shoes', 'bags', 'jewel', 'watch', 'optical', 'accessor')):
        return 'fashion'
    if any(k in c for k in ('beauty', 'health', 'hair', 'wellness', 'medical', 'dental')):
        return 'beauty'
    if any(k in c for k in ('fitness', 'sport')):
        return 'fit'
    if any(k in c for k in ('entertain', 'leisure', 'hobb', 'toy', 'music')):
        return 'fun'
    if any(k in c for k in ('home', 'houseware', 'furnish', 'lifestyle', 'electr', 'technology', 'it &', 'gift', 'pets')):
        return 'home'
    if any(k in c for k in ('kid', 'enrichment', 'education', 'stationery')):
        return 'kids'
    return 'svc'


sm = json.load(open(M_SM))
off = json.load(open(M_OFF))
malls = {}


def add_mall(mid, name, stores, source):
    floors = collections.defaultdict(list)
    seenst = set()
    for s in stores:
        nm = re.sub(r'\s+', ' ', s['n']).strip()
        nm = nm.replace('\\"', '"')
        unit = re.sub(r',?\s*(PLQ Mall|Level [B0-9]+|Basement [0-9]+|Level B[0-9]|Basement Two)\b', '', s.get('u', ''), flags=re.I).strip(' ,')
        k = norm(nm)
        if not k or k in seenst:
            continue
        seenst.add(k)
        floors[level_of(s.get('u', ''))].append([nm, unit, mall_cat(s.get('c', ''), nm)])
    order = sorted(floors.keys(), key=lambda f: (-1 if f == '?' else 0, -int(f[1:]) if f.startswith('B') else int(f[1:]) if f != '?' else 99))
    malls[mid] = {'name': name, 'src': source, 'floors': [[f, sorted(floors[f], key=lambda s: s[0].lower())] for f in order]}


for mid, d in off.items():
    add_mall(mid, d['name'], d['stores'], 'Official directory, Nov 2026')
for mid, d in sm.items():
    if mid in malls:
        continue
    add_mall(mid, d['name'], d['stores'], 'SingMalls directory, Nov 2026')

# malls without a published directory: build from places inside the building / curated "in"
KSC = [("Katong Mei Wei Boneless Chicken Rice", "#B1-85/87", "food"), ("Dona Manis Cake Shop", "#B1-93", "food"),
       ("Auntie Peng Banana Pie", "#B1-92", "food"), ("Golden Cafe", "#B1-124", "food"), ("Hara Hetta Café", "#B1-02", "food"),
       ("About Coffee Co.", "#01-29", "food"), ("Janie The Bakery", "#02-72", "food"), ("CubeWerkz", "#02-32", "fun"),
       ("Harmonious Collectibles", "", "fun"), ("Hobby Bounties", "", "fun"), ("Healing Heritage", "#B1-26", "beauty"),
       ("Dong Fa Foot Reflexology", "#B1-98", "beauty"), ("Teo Heng Trading (karaoke systems)", "#02-13/14", "home"),
       ("B.Spoke by Jamco (eyewear)", "#B1-99", "fashion"), ("Math Vigilante", "#02-77", "kids")]
malls['katong-shopping-centre'] = {'name': 'Katong Shopping Centre', 'src': 'TheSmartLocal & The Ranting Panda guides',
                                   'floors': [[f, [[n, u, c] for (n, u, c) in KSC if level_of(u) == f]] for f in ('L2', 'L1', 'B1', '?')]}
malls['katong-shopping-centre']['floors'] = [fl for fl in malls['katong-shopping-centre']['floors'] if fl[1]]


def mall_from_places(mid, name, match_names, source):
    rows = []
    mp = next((p for p in places if p.get('mall') == mid), None)
    for p in places:
        if p.get('c') == 'mall':
            continue
        inn = norm(p.get('in', ''))
        if any(norm(m) == inn or (len(inn) > 5 and norm(m) in inn) for m in match_names) or (mp is not None and mp.get('bi') is not None and p.get('bi') == mp.get('bi')):
            unit = ''
            mm = re.search(r'#\s?[B0-9]{1,3}-[0-9A-Z/&]+', p.get('a', ''))
            if mm:
                unit = mm.group(0)
            elif p.get('lvl'):
                unit = 'Level ' + str(p['lvl'])
            cat = {'cafe': 'food', 'eat': 'food', 'hawker': 'food', 'dessert': 'food', 'bar': 'food', 'fit': 'fit', 'beauty': 'beauty',
                   'shop': 'fashion', 'do': 'fun', 'ess': 'svc', 'stay': 'svc'}.get(p['c'], 'svc')
            rows.append([p['n'], unit, cat, p['id']])
    if not rows:
        return
    floors = collections.defaultdict(list)
    for r in rows:
        floors[level_of(r[1])].append(r)
    order = sorted(floors.keys(), key=lambda f: (-1 if f == '?' else 0, -int(f[1:]) if f.startswith('B') else int(f[1:]) if f != '?' else 99))
    malls[mid] = {'name': name, 'src': source, 'floors': [[f, sorted(floors[f], key=lambda s: s[0].lower())] for f in order]}


malls['roxy-square'] = {'name': 'Roxy Square', 'src': 'Partial list from guides, listings and OpenStreetMap. Roxy Square publishes no directory',
                        'floors': [['L1', [['HairWe Hub', '#01-105', 'beauty', 'hairwe-hub'], ['Janggut Laksa', '#01-64', 'food', 'janggut-laksa'],
                                           ['Windowsill Pies', '#01-136', 'food', 'windowsill-pies']]],
                                   ['?', [['Beyond Beauty', '', 'beauty'], ['Feast@East buffet restaurant (Grand Mercure Roxy)', '', 'food'],
                                          ['Grand Mercure Singapore Roxy (hotel)', '', 'svc']]]]}
mall_from_places('katong-square', 'Katong Square', ['Katong Square', 'Holiday Inn Express Katong'], 'Guides + OpenStreetMap')
mall_from_places('the-flow', 'The Flow', ['The Flow'], 'Guides + OpenStreetMap')
mall_from_places('katong-point', 'Katong Point', ['Katong Point'], 'Guides + OpenStreetMap')
mall_from_places('odeon-katong', 'The Odeon Katong', ['The Odeon Katong', 'Odeon Katong Shopping Complex'], 'Guides + OpenStreetMap')
MALL_OF = {'i12katong': 'i12-katong', 'katongv': 'katong-v', 'plqmall': 'paya-lebar-quarter', 'plqparkside': 'paya-lebar-quarter',
           'plqplaza': 'paya-lebar-quarter', 'parkwayparade': 'parkway-parade'}
for p in places:
    if not p.get('hot') or p.get('c') == 'mall':
        continue
    mid = MALL_OF.get(norm(p.get('in', '')))
    if not mid or mid not in malls:
        continue
    um = re.search(r'#\s?[B0-9]{1,3}-[0-9A-Z/&]+', p.get('a', ''))
    unit = um.group(0) if um else ''
    cat = {'cafe': 'food', 'eat': 'food', 'hawker': 'food', 'dessert': 'food', 'bar': 'food', 'fit': 'fit', 'beauty': 'beauty',
           'shop': 'fashion', 'do': 'fun'}.get(p['c'], 'svc')
    found = False
    for fl in malls[mid]['floors']:
        keep = []
        for row in fl[1]:
            if similar(row[0], p['n']) or (norm(row[0])[:8] and norm(row[0])[:8] == norm(p['n'])[:8]):
                if len(row) < 4:
                    row.append(p['id'])
                found = True
                keep.append(row)
            elif unit and norm(row[1]) == norm(unit):
                continue        # stale tenant at the same unit
            else:
                keep.append(row)
        fl[1] = keep
    if not found:
        lv = level_of(unit)
        for fl in malls[mid]['floors']:
            if fl[0] == lv:
                fl[1].append([p['n'], unit, cat, p['id']])
                fl[1].sort(key=lambda s: s[0].lower())
                break
        else:
            malls[mid]['floors'].append([lv, [[p['n'], unit, cat, p['id']]]])
print('malls', {k: sum(len(f[1]) for f in v['floors']) for k, v in malls.items()})

# ---------------------------------------------------------------- dates
dates = json.load(open(os.path.join(TOOLS, 'dates.json'), encoding='utf8')) if os.path.exists(os.path.join(TOOLS, 'dates.json')) else []
pid = {p['id'] for p in places}
for d in dates:
    for st in d['stops']:
        assert st['id'] in pid, ('date stop missing', d['id'], st['id'])

SOURCES = {
    'rp26': ['The Ranting Panda · Best cafés in Joo Chiat & Katong (Sep 2026)', 'https://therantingpanda.com/2026/09/25/food-scoops-cafes-to-check-out-in-joo-chiat-and-katong-guide-to-your-coffee-and-brunch-fix-in-east-coast/'],
    'rpn26': ['The Ranting Panda · New restaurants in Joo Chiat & Katong (Sep 2026)', 'https://therantingpanda.com/2026/09/05/food-scoops-the-most-exciting-new-dining-concepts-to-check-out-in-joo-chiat-right-now/'],
    'op26': ['The Ordinary Patrons · Top cafes in Joo Chiat (Jul 2026)', 'https://ordinarypatrons.com/2026/07/15/top-cafes-in-joo-chiat/'],
    'eb': ['Eatbook · Katong cafes, cafes in the East, Katong food guide', 'https://eatbook.sg/katong-cafe/'],
    'tsl': ['TheSmartLocal · Joo Chiat & Katong guide', 'https://thesmartlocal.com/read/joo-chiat-katong-guide/'],
    'hc': ['Honeycombers · Joo Chiat guide, East Coast Park guide, Pilates studios', 'https://thehoneycombers.com/singapore/cafes-in-katong-and-joo-chiat-singapore-best-spots-for-coffee-brunch-tea-and-cakes/'],
    'ww': ["Singapore Women's Weekly · Cafes in the East", 'https://www.womensweekly.com.sg/food/best-cafes-singapore-east'],
    'hw': ['Her World · Pilates studios in the east, East Coast guide', 'https://www.herworld.com/wellness/body/pilates-studios-east-singapore'],
    'cn': ['City Nomads · Dining guide to Katong and Joo Chiat', 'https://citynomads.com/dining-guide-to-katong-and-joo-chiat-best-restaurants-cafes-eateries-in-the-neighbourhood/'],
    'ldo': ['Little Day Out · Joo Chiat guide, East Coast Park guide', 'https://www.littledayout.com/joo-chiat-food-shopping-sights-guide'],
    'l8': ['Lemon8 · Pilates studios in the east review', 'https://www.lemon8-app.com/@znxnsjsjx/7575400936944730644?region=sg'],
    'cp': ['ClassPass & studio listings', 'https://classpass.com/partners/lists/singapore-reformer-pilates/'],
    'el': ['Expat Living · East Coast guide', 'https://expatliving.sg/east-coast-food-katong-joo-chiat-restaurants-bars-brunch-cafe-near-me/'],
    'sl': ['Seth Lui & Seek Sophie · craft workshop guides', 'https://sethlui.com/craft-workshops-guide-singapore/'],
    'tvl': ['Traveloka · Joo Chiat neighbourhood guide', 'https://www.traveloka.com/en-sg/explore/tips/guide-to-joo-chiat-road-acc/411764'],
    'np': ['NParks · East Coast Park', 'https://www.nparks.gov.sg/visit/parks/east-coast-park'],
    'lulu': ['lululemon · i12 Katong store', 'https://www.lululemon.com.hk/en-sg/c/community/events/singapore'],
    'off': ['Official mall directories (Parkway Parade, PLQ) · Nov 2026', 'https://www.parkwayparade.com.sg/store-directory/'],
    'sm': ['SingMalls mall directories · Nov 2026', 'https://singmalls.app/en/malls/i12-katong/directory'],
    'osm': ['OpenStreetMap contributors', 'https://www.openstreetmap.org/copyright'],
}

out = {'v': 1, 'places': places, 'malls': malls, 'dates': dates, 'sources': SOURCES}
js = 'window.KD_PLACES=' + json.dumps(out, separators=(',', ':'), ensure_ascii=False) + ';\n'
open(OUT, 'w', encoding='utf8').write(js)
print('places', len(places), 'hot', sum(1 for p in places if p.get('hot')), 'file', round(len(js) / 1e6, 2), 'MB')
print(collections.Counter(p['c'] for p in places).most_common())
print('--- geocode report')
bym = collections.Counter(r[0] for r in report)
print(dict(bym))
for r in report:
    if r[0] not in ('osm-addr', 'manual'):
        print('  ', r)
