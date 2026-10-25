"""Search Wikimedia Commons for freely licensed photos and print candidates (title, size, licence, author).

python3 tools/commons.py "query" [n]
"""
import json, re, sys, urllib.parse, urllib.request

UA = {"User-Agent": "NissologyCourse/1.0 (educational course build; contact via GitHub jvi-44)"}
API = "https://commons.wikimedia.org/w/api.php"
OK = re.compile(r"^(CC BY|CC-BY|CC BY-SA|CC-BY-SA|CC0|Public domain|PD|No restrictions|Attribution)", re.I)


def api(params):
    url = API + "?" + urllib.parse.urlencode({**params, "format": "json"})
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return json.load(r)


def clean(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


def search(q, n=12, width=1600):
    d = api({"action": "query", "generator": "search", "gsrsearch": f"filetype:bitmap {q}", "gsrnamespace": 6,
             "gsrlimit": n, "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": width})
    out = []
    for p in sorted(d.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0)):
        ii = p["imageinfo"][0]; m = ii.get("extmetadata", {})
        lic = clean(m.get("LicenseShortName", {}).get("value"))
        out.append(dict(title=p["title"], w=ii["width"], h=ii["height"], thumb=ii.get("thumburl"), page=ii["descriptionurl"],
                        license=lic, ok=bool(OK.match(lic)), author=clean(m.get("Artist", {}).get("value"))[:80],
                        desc=clean(m.get("ImageDescription", {}).get("value"))[:160], date=clean(m.get("DateTimeOriginal", {}).get("value"))[:20]))
    return out


if __name__ == "__main__":
    for i, c in enumerate(search(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 12)):
        print(f"[{i}] {'OK ' if c['ok'] else 'NO '}{c['w']}x{c['h']} {c['license']} | {c['title']} | {c['author']} | {c['date']} | {c['desc'][:110]}")
