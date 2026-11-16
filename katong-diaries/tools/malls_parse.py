import sys, re, json, os, math
src, out = sys.argv[1], sys.argv[2]
LAT0, LON0 = 1.30520, 103.90504
res = {}
for fn in sorted(os.listdir(src)):
    if not fn.endswith('.html'): continue
    h = open(os.path.join(src, fn), encoding='utf8', errors='ignore').read()
    m = re.search(r'<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)</script>', h, re.S)
    if not m: print('no data', fn); continue
    pp = json.loads(m.group(1))['props']['pageProps']
    geo = pp['schema'].get('geo', {})
    lat, lon = geo.get('latitude'), geo.get('longitude')
    dist = math.hypot((lon - LON0) * 111.29, (lat - LAT0) * 110.57) if lat else None
    stores = [{'n': x.get('formattedName') or x['name'], 'u': x.get('formattedLots', ''), 'c': x.get('formattedCategories', '')} for x in pp['merchants']]
    res[pp['site']['id']] = {'name': pp['site']['name'], 'addr': pp['site']['formattedAddress'], 'lat': lat, 'lon': lon, 'stores': stores}
    print(f"{pp['site']['id']:22s} {len(stores):4d} stores  dist {dist:.2f} km  {pp['site']['formattedAddress']}")
json.dump(res, open(out, 'w'), indent=0)
