"""Assemble the course site into site/.

  python3 tools/dem.py tools/islands.json   # (re)build heightmaps into site/data/dem
  python3 tools/annotate.py                 # build annotated PDFs + site/data/annotations.json
  python3 tools/build.py                    # inline content, CSS and JS into site/index.html
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "content"))
from readings import KINDS, READINGS  # noqa: E402
from units import COURSE, UNITS  # noqa: E402
from videos import VIDEOS  # noqa: E402
from quizzes import CHECKS, TASKS, UNIT_QUIZ  # noqa: E402
try:
    from photos import PHOTOS  # noqa: E402
except ImportError:
    PHOTOS = {}
import re  # noqa: E402

DEM_NAMES = {
    "funafuti": "Funafuti Atoll", "pitcairn": "Pitcairn Island", "henderson": "Henderson Island",
    "falklands": "Falkland Islands", "tristan": "Tristan da Cunha", "surtsey": "Surtsey and Vestmannaeyjar",
    "socotra": "Socotra",
}


def main():
    web = os.path.join(ROOT, "web")
    site = os.path.join(ROOT, "site")
    meta = json.load(open(os.path.join(site, "data", "dem", "meta.json")))
    dems = {m["id"]: {**m, "name": DEM_NAMES[m["id"]]} for m in meta}
    # validate that every reading referenced by a unit exists and vice versa
    ids = {r["id"] for r in READINGS}
    for u in UNITS:
        for rid in u.get("readings", []):
            assert rid in ids, f"unit {u['id']} references unknown reading {rid}"
        for body in (b for _, b in u["sections"]):
            for rid in [p.split('"')[0] for p in body.split('data-reading="')[1:]]:
                assert rid in ids, f"unit {u['id']} links unknown reading {rid}"
    readings = [{k: v for k, v in r.items() if k != "notes"} for r in READINGS]
    vindex_path = os.path.join(site, "media", "video", "index.json")
    vindex = json.load(open(vindex_path)) if os.path.exists(vindex_path) else {}
    vidx, unit_photos = {}, {}
    for vid, v in VIDEOS.items():
        unit = vid.rsplit("-", 1)[0]
        for sc in v["scenes"]:
            if sc.get("photo"):
                unit_photos.setdefault(unit, []).append(sc["photo"])
        if vid not in vindex:
            continue
        pts = []
        for sc in v["scenes"]:
            if sc["type"] == "points":
                pts += sc["items"]
            elif sc["type"] == "stat":
                pts += [f"<b>{x['v']}</b> {x['label']}" for x in sc.get("stats", [])] or [f"<b>{sc['value']}</b> {sc['label']}"]
        vidx[vid] = dict(dur=vindex[vid]["dur"], paras=[sc["say"] for sc in v["scenes"]], points=pts[:8])
    for vid in CHECKS:
        assert vid in VIDEOS, f"check for unknown video {vid}"
    photos = {k: {f: p[f] for f in ("caption", "alt", "credit", "author", "license", "page", "source")} for k, p in PHOTOS.items()}
    kinds = {k: {"label": v["label"]} for k, v in KINDS.items()}
    data = "\n".join(
        f"const {name} = {json.dumps(val, ensure_ascii=False, separators=(',', ':'))};"
        for name, val in [("COURSE", COURSE), ("UNITS", UNITS), ("READINGS", readings), ("KINDS", kinds), ("DEMS", dems),
                          ("VIDX", vidx), ("CHECKS", CHECKS), ("UNIT_QUIZ", UNIT_QUIZ), ("TASKS", TASKS), ("PHOTOS", photos), ("UNIT_PHOTOS", unit_photos)]
    )
    tpl = open(os.path.join(web, "index.template.html")).read()
    out = (tpl.replace("/*__CSS__*/", open(os.path.join(web, "styles.css")).read())
              .replace("/*__DATA__*/", data.replace("</", "<\\/"))
              .replace("/*__DIAGRAMS__*/", open(os.path.join(web, "diagrams.js")).read())
              .replace("/*__APP__*/", open(os.path.join(web, "app.js")).read()))
    with open(os.path.join(site, "index.html"), "w") as f:
        f.write(out)
    print(f"site/index.html {len(out) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
