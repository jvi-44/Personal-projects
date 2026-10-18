"""Print text lines with coordinates (PDF points, origin top-left) for chosen pages.
Usage: python3 lines.py paper.pdf [first [last]]
Skips margin boilerplate. Marks vertical gaps > 40pt as GAP lines (answer space)."""
import subprocess, sys, re, html
pdf = sys.argv[1]
first = sys.argv[2] if len(sys.argv) > 2 else '1'
last = sys.argv[3] if len(sys.argv) > 3 else first if len(sys.argv) > 2 else '999'
out = subprocess.run(['pdftotext', '-bbox-layout', '-f', first, '-l', last, pdf, '-'],
                     capture_output=True, text=True).stdout
pages = re.split(r'<page ', out)[1:]
skip = re.compile(r'DO NOT WRITE|MARGIN|Turn over|©|Examiner|^For$|^use$|examiners', re.I)
for i, pg in enumerate(pages):
    pno = int(first) + i
    w, h = re.search(r'width="([\d.]+)" height="([\d.]+)"', pg).groups()
    print(f'=== page {pno} ({float(w):.0f}x{float(h):.0f})')
    lines = []
    for m in re.finditer(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</line>', pg, re.S):
        x0, y0, x1, y1 = map(float, m.groups()[:4])
        words = re.findall(r'>([^<]*)</word>', m.group(5))
        t = html.unescape(' '.join(words)).strip()
        t = re.sub(r'[.…]{4,}', '____', t)
        if not t or skip.search(t):
            continue
        lines.append((y0, x0, x1, y1, t))
    lines.sort()
    prev = 60
    for y0, x0, x1, y1, t in lines:
        if y0 - prev > 40:
            print(f'      GAP {prev:.0f}-{y0:.0f}')
        print(f'{y0:5.0f} {x0:4.0f}-{x1:4.0f} {t[:90]}')
        prev = max(prev, y1)
