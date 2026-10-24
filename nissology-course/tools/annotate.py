"""Build annotated study editions of the openly licensed course readings.

For every hosted reading in content/readings.py this script
  1. finds each annotation's quote in the source PDF and adds a highlight
     (colour = annotation kind) carrying the note as its pop-up text, plus a
     margin note icon;
  2. prepends a cover page (citation, licence, what was changed, legend, notes
     index) and appends a reading guide (route, key terms, questions);
  3. writes site/pdfs/<id>-annotated.pdf and site/data/annotations.json, which
     the web reader uses to draw clickable highlight overlays.

Usage: python3 tools/annotate.py
"""
import html
import json
import os
import sys

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "content"))
from readings import KINDS, READINGS  # noqa: E402

SRC = os.path.join(ROOT, "sources", "papers")
OUT_PDF = os.path.join(ROOT, "site", "pdfs")
OUT_JSON = os.path.join(ROOT, "site", "data", "annotations.json")
SEARCH_FLAGS = pymupdf.TEXT_DEHYPHENATE | pymupdf.TEXT_MEDIABOX_CLIP

CSS = """
* { font-family: sans-serif; }
body { font-size: 10pt; line-height: 1.38; color: #14233a; }
h1 { font-size: 17pt; line-height: 1.2; margin: 0 0 6pt 0; }
h2 { font-size: 11.5pt; margin: 12pt 0 4pt 0; color: #0d4f6b; }
p, li { margin: 0 0 4pt 0; }
.eyebrow { font-size: 8.5pt; letter-spacing: 1pt; color: #6b7a8c; text-transform: uppercase; }
.cite { font-size: 9.5pt; color: #33455c; }
.small { font-size: 8.5pt; color: #4d5e72; }
table { border-collapse: collapse; width: 100%; }
td { vertical-align: top; padding: 2pt 4pt; font-size: 9pt; border-bottom: 0.4pt solid #c9d3dd; }
.n { width: 22pt; font-weight: bold; }
.k { width: 70pt; }
"""


def esc(s):
    return html.escape(str(s))


def story_pdf(body_html, width=595, height=842, margin=48):
    """Render HTML into a standalone PDF document (A4 by default)."""
    story = pymupdf.Story(html=body_html, user_css=CSS)
    buf = pymupdf.open()
    mediabox = pymupdf.Rect(0, 0, width, height)
    where = mediabox + (margin, margin, -margin, -margin)
    import io
    fp = io.BytesIO()
    writer = pymupdf.DocumentWriter(fp)
    more = True
    while more:
        dev = writer.begin_page(mediabox)
        more, _ = story.place(where)
        story.draw(dev)
        writer.end_page()
    writer.close()
    buf = pymupdf.open("pdf", fp.getvalue())
    return buf


def swatch(kind):
    r, g, b = KINDS[kind]["rgb"]
    return "#%02x%02x%02x" % (int(r * 255), int(g * 255), int(b * 255))


def cover_html(r, placed):
    rows = "".join(
        f"<p><b>{i + 1}.</b> <span style='background-color:{swatch(n['kind'])}'>&#160;{esc(KINDS[n['kind']]['label'])}&#160;</span> "
        f"<span class='small'>p.&#160;{n['orig_page'] + 1}</span> {esc(n['note'])}</p>"
        for i, n in enumerate(placed)
    )
    legend = " &#160; ".join(
        f"<span style='background-color:{swatch(k)}'>&#160;{esc(v['label'])}&#160;</span>" for k, v in KINDS.items()
    )
    return f"""
<p class='eyebrow'>Nissology: Islands of the Modern World · Annotated study edition</p>
<h1>{esc(r['title'])}</h1>
<p class='cite'>{esc(r['authors'])} ({r['year']}). <i>{esc(r['journal'])}</i>. https://doi.org/{esc(r['doi'])}</p>
<h2>Licence and changes</h2>
<p class='small'>The original article is published under {esc(r['license'])}. This study edition reproduces it unaltered and adds:
this cover page, colour highlights with margin notes (open a highlight or note icon to read the comment), and a reading guide at the end.
Annotations are teaching commentary and are not endorsed by the authors or publisher. Page numbers below refer to the original article PDF.</p>
<h2>Why we read it</h2>
<p>{esc(r['why'])}</p>
<h2>Highlight colours</h2>
<p class='small'>{legend}</p>
<h2>Annotations ({len(placed)})</h2>
{rows}
"""


def guide_html(r):
    before = "".join(f"<li>{esc(b)}</li>" for b in r.get("before", []))
    route = "".join(f"<li><b>{esc(w)}</b>: {esc(t)}</li>" for w, t in r.get("route", []))
    terms = "".join(f"<li><b>{esc(t)}</b>: {esc(d)}</li>" for t, d in r.get("terms", []))
    qs = "".join(f"<li>{esc(q)}</li>" for q in r.get("questions", []))
    return f"""
<p class='eyebrow'>Reading guide · {esc(r['authors'].split(',')[0])} ({r['year']})</p>
<h1>How to read this paper</h1>
<h2>Before you start</h2><ul>{before}</ul>
<h2>Reading route (about {r.get('minutes', 60)} minutes)</h2><ol>{route}</ol>
<h2>Key terms</h2><ul>{terms}</ul>
<h2>Questions for seminar or written response</h2><ol>{qs}</ol>
<p class='small'>Course site: Nissology: Islands of the Modern World. Annotated by the course author for study use.</p>
"""


def find(doc, page_hint, quote):
    order = list(range(len(doc)))
    if page_hint is not None and 1 <= page_hint <= len(doc):
        order.remove(page_hint - 1)
        order.insert(0, page_hint - 1)
    for pi in order:
        quads = doc[pi].search_for(quote, quads=True, flags=SEARCH_FLAGS)
        if quads:
            if len(quote) < 30:
                # short quote: keep only the first line-hit to avoid marking every repeat
                quads = quads[:1]
            return pi, quads
    return None, None


def build(r):
    src = pymupdf.open(os.path.join(SRC, r["file"]))
    placed, missing = [], []
    for page, kind, quote, note in r["notes"]:
        pi, quads = find(src, page, quote)
        if pi is None:
            missing.append(quote)
            continue
        pg = src[pi]
        annot = pg.add_highlight_annot(quads)
        annot.set_colors(stroke=KINDS[kind]["rgb"])
        annot.set_opacity(0.55)
        annot.set_info(title=f"Nissology course · {KINDS[kind]['label']}", content=note, subject=KINDS[kind]["label"])
        annot.update()
        rect = quads[0].rect
        for q in quads[1:]:
            rect |= q.rect
        # margin note icon beside the first line of the highlight
        w = pg.rect.width
        x = w - 20 if rect.x0 > w / 2 else 4
        icon = pg.add_text_annot(pymupdf.Point(x, max(rect.y0 - 2, 2)), note, icon="Comment")
        icon.set_colors(stroke=KINDS[kind]["rgb"])
        icon.set_info(title=f"Nissology course · {KINDS[kind]['label']}", content=note)
        icon.update()
        W, H = pg.rect.width, pg.rect.height
        placed.append(dict(
            kind=kind, note=note, quote=quote, orig_page=pi,
            rects=[[round(q.rect.x0 / W, 4), round(q.rect.y0 / H, 4), round(q.rect.x1 / W, 4), round(q.rect.y1 / H, 4)] for q in quads],
        ))
    # keep notes in reading order
    placed.sort(key=lambda n: (n["orig_page"], min(rc[1] for rc in n["rects"])))
    cover = story_pdf(cover_html(r, placed))
    guide = story_pdf(guide_html(r))
    n_front = len(cover)
    src.insert_pdf(cover, start_at=0)
    src.insert_pdf(guide)
    src.set_metadata({**src.metadata, "title": f"{r['title']} (annotated study edition)", "subject": "Nissology course reading"})
    out = os.path.join(OUT_PDF, f"{r['id']}-annotated.pdf")
    src.save(out, garbage=4, deflate=True)
    for n in placed:
        n["page"] = n["orig_page"] + n_front  # zero-based page index in the annotated PDF
    return dict(file=f"pdfs/{r['id']}-annotated.pdf", front=n_front, pages=len(src), notes=placed), missing


def main():
    os.makedirs(OUT_PDF, exist_ok=True)
    data, bad = {}, 0
    for r in READINGS:
        if not r.get("hosted"):
            continue
        info, missing = build(r)
        data[r["id"]] = info
        size = os.path.getsize(os.path.join(ROOT, "site", info["file"])) / 1e6
        print(f"{r['id']:<18} {len(info['notes']):>2}/{len(r['notes'])} notes placed  {info['pages']:>3} pp  {size:5.1f} MB")
        for m in missing:
            bad += 1
            print(f"    MISSING: {m!r}")
    with open(OUT_JSON, "w") as f:
        json.dump(data, f, separators=(",", ":"))
    if bad:
        sys.exit(f"{bad} quotes not found")


if __name__ == "__main__":
    main()
