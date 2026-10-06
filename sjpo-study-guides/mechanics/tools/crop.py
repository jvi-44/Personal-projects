"""Crop SJPO past-year questions out of the original papers into PNGs.

Usage: python3 -I crop.py <dir-with-qYYYY.pdf> <out-dir>
Each spec entry is id -> list of (page, y_top, y_bottom) in PDF points;
y_bottom of None means "down to the page footer".
"""
import sys, re, os
import pymupdf as fitz
from PIL import Image, ImageOps

SRC, OUT = sys.argv[1], sys.argv[2]
F = None

SPEC = {
    "2018": {
        "Q2": [(2, 374, 524)], "Q3": [(2, 524, 674)], "Q4": [(2, 674, F)],
        "Q5": [(3, 33, 170)], "Q6": [(3, 170, 439)], "Q7": [(3, 439, 616)], "Q8": [(3, 616, F)],
        "Q9": [(4, 33, 233)], "Q10": [(4, 233, 397)], "Q11": [(4, 397, F)],
        "Q12": [(5, 33, 321)], "Q13": [(5, 321, 471)], "Q14": [(5, 471, F)],
        "Q15": [(6, 33, 372)], "S16": [(6, 372, 523)], "Q16": [(6, 523, 646)], "Q17": [(6, 646, F)],
        "Q18": [(7, 33, 359)], "Q19": [(7, 359, 523)], "Q20": [(7, 523, F)],
        "Q50": [(14, 618, F)],
    },
    "2022": {
        "S1": [(3, 95, 223)], "Q1": [(3, 223, 355)], "Q2": [(3, 355, 493)], "Q3": [(3, 493, F)],
        "S4": [(4, 57, 148)], "Q4": [(4, 148, 308)], "Q5": [(4, 308, 452)],
        "S6": [(4, 452, 613)], "Q6": [(4, 613, F)], "Q7": [(5, 57, 283)],
        "S8": [(5, 283, 415)], "Q8": [(5, 415, 604)],
        "Q10": [(6, 57, 299)], "Q11": [(6, 299, 474)], "Q12": [(6, 474, F)], "Q13": [(7, 58, 234)],
        "S14": [(7, 234, 339)], "Q14": [(7, 339, 499)], "Q15": [(7, 499, F)], "Q16": [(8, 57, 232)],
        "S17": [(8, 232, 417)], "S17b": [(8, 417, 493)], "Q17": [(8, 493, F)], "Q18": [(9, 57, 295)],
        "S19": [(9, 295, 356)], "Q19": [(9, 356, 565)], "Q20": [(9, 565, F)],
        "Q21": [(10, 57, 309)], "Q22": [(10, 309, 484)],
        "Q24": [(11, 56, 233)], "S25": [(11, 233, 317)], "Q25": [(11, 317, 477)], "Q26": [(11, 477, F)],
    },
    "2024": {
        "Q1": [(1, 186, 469)], "Q2": [(1, 469, 607)], "Q3": [(1, 607, F)],
        "Q4": [(2, 74, 234)], "S5": [(2, 234, 400)], "Q5": [(2, 400, 541)], "Q6": [(2, 541, F)],
        "Q7": [(3, 74, 471)], "Q8": [(3, 471, F)], "Q9": [(4, 74, 356)], "Q10": [(4, 356, F)],
        "Q11": [(5, 74, 434)], "Q12": [(5, 434, F)], "Q13": [(6, 74, 453)], "Q14": [(6, 453, F)],
        "Q15": [(7, 74, 418)], "Q16": [(7, 418, F)], "Q17": [(8, 74, 450)], "Q18": [(8, 450, F)],
        "Q20": [(9, 377, F)], "Q21": [(10, 74, 429)], "Q22": [(10, 429, F), (11, 40, 167)],
        "Q23": [(11, 167, 488)], "Q24": [(11, 488, F)],
    },
    "2026": {
        "Q1": [(1, 275, 495)], "Q3": [(2, 75, 489)], "Q5": [(3, 75, 381)], "Q6": [(3, 381, F)],
        "Q7": [(4, 75, 449)], "Q8": [(4, 449, F)], "Q9": [(5, 75, F)], "Q11": [(7, 75, F)],
        "Q12": [(8, 75, F)], "Q13": [(9, 75, F)], "Q14": [(10, 75, F)], "Q16": [(12, 75, F)],
        "S17": [(13, 75, 294)], "Q17": [(13, 294, 518)], "Q18": [(13, 518, F)],
        "Q19": [(14, 75, F)], "Q20": [(15, 75, F)], "Q21": [(16, 75, F)],
        "Q22": [(17, 75, 397)], "Q23": [(17, 397, F)], "Q24": [(18, 75, F)],
    },
}

FOOT = re.compile(r"^(Page \d+( of \d+)?|\d{1,2})$")
DPI = 200


def footer_y(page):
    lines = [(l["bbox"][1], "".join(s["text"] for s in l["spans"]).strip())
             for b in page.get_text("dict")["blocks"] for l in b.get("lines", [])]
    lines = [l for l in lines if l[1]]
    y, text = max(lines)
    return y if FOOT.match(text) else page.rect.height - 30


def trim(im, pad=14):
    g = ImageOps.invert(im.convert("L")).point(lambda v: 255 if v > 18 else 0)
    box = g.getbbox()
    if not box:
        return im
    x0, y0, x1, y1 = box
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))


os.makedirs(OUT, exist_ok=True)
for year, qs in SPEC.items():
    doc = fitz.open(os.path.join(SRC, f"q{year}.pdf"))
    for qid, segs in qs.items():
        parts = []
        for pg, y0, y1 in segs:
            page = doc[pg - 1]
            if y1 is None:
                y1 = footer_y(page) - 4
            clip = fitz.Rect(20, max(0, y0 - (1 if year == "2018" else 6)), page.rect.width - 20, y1 - 2)
            pix = page.get_pixmap(dpi=DPI, clip=clip)
            parts.append(trim(Image.frombytes("RGB", (pix.width, pix.height), pix.samples)))
        w = max(p.width for p in parts)
        canvas = Image.new("RGB", (w, sum(p.height for p in parts)), "white")
        y = 0
        for p in parts:
            canvas.paste(p, (0, y)); y += p.height
        canvas = canvas.quantize(colors=64)
        canvas.save(os.path.join(OUT, f"{year}-{qid}.png"), optimize=True)
print("done")
