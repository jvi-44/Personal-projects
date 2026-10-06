"""Find the PDF page of every chapter, section, example and tutorial block.

Usage: python3 -I pages.py <mechanics-dir>   -> writes platform/pages.js
"""
import json, os, re, sys
import pymupdf as fitz

ROOT = sys.argv[1]


def page_texts(pdf):
    return [p.get_text() for p in fitz.open(pdf)]


def first(texts, pattern, start=0):
    rx = re.compile(pattern, re.I | re.M)
    for i in range(start, len(texts)):
        if rx.search(texts[i]):
            return i + 1
    return None


guide = page_texts(os.path.join(ROOT, "pdf", "SJPO-Mechanics-Study-Guide.pdf"))
sol = page_texts(os.path.join(ROOT, "pdf", "SJPO-Mechanics-Solutions.pdf"))
data = open(os.path.join(ROOT, "platform", "data.js")).read()
course = json.loads(data[data.index("{"): data.rstrip().rindex("}") + 1])

out = {"guide": {}, "sol": {}}
for ch in course["chapters"]:
    n = ch["n"]
    out["guide"][f"ch{n}"] = first(guide, rf"^{n}[ \n]{re.escape(ch['title'])}$", 3)
    out["sol"][f"ch{n}"] = first(sol, rf"Worked solutions to the examples in Chapter {n}\.")
    for s in ch["sections"]:
        title = re.escape(s["title"]).replace(r"\ ", "[ \n]+")
        out["guide"][s["id"]] = first(guide, rf"^{re.escape(s['id'])}[ \n]*{title}", 3)
        out["sol"][s["id"]] = first(sol, rf"^{re.escape(s['id'])}[ \n]+{title}", 1)
        for e in s["examples"]:
            out["guide"]["E" + e["num"]] = first(guide, rf"^EXAMPLE {re.escape(e['num'])}\s*$")
            out["sol"]["E" + e["num"]] = first(sol, rf"^EXAMPLE {re.escape(e['num'])}\s*$")
out["guide"]["T"] = first(guide, r"^T[ \n]Tutorial Questions$", 3)
out["sol"]["T"] = first(sol, r"^T[ \n]Tutorial Solutions$", 1)
missing = [f"{k}:{kk}" for k, d in out.items() for kk, v in d.items() if not v]
open(os.path.join(ROOT, "platform", "pages.js"), "w").write("window.PAGES = " + json.dumps(out) + ";\n")
print("indexed", sum(len(d) for d in out.values()), "missing", missing)
