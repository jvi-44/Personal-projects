import sys, re, html, json
src, key, name, out = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
h = html.unescape(open(src, encoding='utf8', errors='ignore').read())
stores = []
# each card: "displayCategory":"..","image":..,"title":"..","link":"/store-directory/..." ... "info":[...]
for m in re.finditer(r'"displayCategory":"(.*?)","image":.*?"title":"(.*?)","link":"(/[^"]*)".*?"info":\[(.*?)\],"cta"', h, re.S):
    cat, title, link, info = m.groups()
    unit = ''
    mm = re.search(r'"label":"([^"]*)","icon":"fa-location-dot"', info)
    if mm: unit = mm.group(1)
    stores.append({'n': title.replace('\\u0026', '&'), 'u': unit.replace('\\u0026', '&'), 'c': cat.replace('\\u0026', '&')})
seen = set(); uniq = []
for s in stores:
    k = (s['n'], s['u'])
    if k in seen: continue
    seen.add(k); uniq.append(s)
print(name, len(uniq), 'stores')
try: d = json.load(open(out))
except Exception: d = {}
d[key] = {'name': name, 'stores': uniq}
json.dump(d, open(out, 'w'), indent=0)
import collections
print(collections.Counter(s['c'] for s in uniq).most_common(20))
