"""Compile every planning question (original page) with its numbered answer key into one PDF.
Usage: python3 tools/plans_pdf.py OUT.pdf"""
import base64, io, os, subprocess, sys, tempfile
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'content'))
from vpl import PRIV, SVG, esc, item_svg, plan_rows, tw, wrap
from plans import PLANS, ORDER
import cairosvg
from pypdf import PdfReader, PdfWriter

W, H = 595.28, 841.89
X0, XW = 56, 483                     # text column
BLUE, DARK, GREY, RULE = '#1550c8', '#1d2a44', '#5b6478', '#c9d3e6'
NAMES = {'hci': 'Hwa Chong Institution', 'ejc': 'Eunoia Junior College', 'njc': 'National Junior College', 'nyjc': 'Nanyang Junior College',
         'sajc': "St. Andrew's Junior College", 'asrjc': 'Anderson Serangoon Junior College', 'vjc': 'Victoria Junior College',
         'tjc': 'Temasek Junior College', 'acjc': 'Anglo-Chinese Junior College', 'dhs': 'Dunman High School'}

# what the answer relies on from earlier in the paper, and figures it refers to: (page, top, bottom, caption) in PDF points from the top
EXTRA = {
    'hci-q2c': dict(context='Figure 2.1: the cell charges C through R₁ (S in position 1); C discharges through R₂ (position 2).',
                    figs=[(6, 118, 330, 'Figure 2.1 (page 6)', 60, 540)]),
    'hci-q3g': dict(context='Figure 3.2: the bent wire with two bobs hangs from a rubber band looped over a rod and twists about the vertical axis.',
                    figs=[(12, 150, 420, 'Figure 3.2 (page 12)', 60, 540)]),
    'ejc-q3e': dict(context='Fig. 3.4 is on the question page. r and q are measured from the pivot at the right-hand end of the rod.'),
    'njc-q2c': dict(context='From part (b): the water cools as θ = m + n e^(−kt), where m is room temperature and k is the cooling constant.'),
    'njc-q3i': dict(context='Only the listed apparatus may be used.'),
    'nyjc-q1f': dict(context='From earlier parts: T² = ax² + b, where x is the distance of the slotted masses from the nail; a ∝ M and b does not depend on M.',
                     figs=[(2, 285, 600, 'Fig. 1.2 (page 2)')]),
    'sajc-q3g': dict(context='Figure 3.2: pendulums A and B hang from a common string; t is the time from releasing A until A first stops.',
                     figs=[(9, 490, 698, 'Figure 3.2 (page 9)')]),
    'asrjc-q2c': dict(context='The wooden strip from Q2 swings about a nail through one of its holes; the magnet is fixed to end B.'),
    'asrjc-q3f': dict(context='Figures 3.3 and 3.4: the container is pushed at the top until it topples; θ is read on the angle scale.',
                      figs=[(11, 300, 775, 'Figures 3.3 and 3.4 (page 11)')]),
    'vjc-q2d': dict(context='Part (c) found E as the area of the loading–unloading loop measured with a force sensor; those sensors are not available here.'),
    'vjc-q3h': dict(context='From (h)(i): B = CnI. Coil Z has the thicker wire and the shorter length, so Z is expected to give the larger B.'),
    'tjc-q3i': dict(context='From (i)(i): B = CnI. Coil Z has the thicker wire and the shorter length, so Z is expected to give the larger B.'),
    'acjc-q3e': dict(context='Fig. 3.2 (on the question page) shows the stem diameter d of the hopper.'),
    'dhs-q1g': dict(context='Fig. 1.3: the cone falls beside a vertical metre rule. Earlier parts timed the unloaded cone with a stopwatch.',
                    figs=[(3, 112, 368, 'Fig. 1.3 (page 3)')]),
    'dhs-q3e': dict(context='Fig. 3.1: the bottom half-metre rule hangs from two string loops a distance d apart and oscillates about a vertical axis.',
                    figs=[(12, 180, 408, 'Fig. 3.1 (page 12)')]),
}

TEMPLATE = '''
## 1. Diagram
1) Draw a labelled diagram of a workable set-up: every instrument named, the quantities to be measured marked (e.g. d, l, x), and the variable being changed shown.
## 2. Variables
2) Independent variable: the quantity you change. Dependent variable: the quantity you measure. Controlled variables: name each one and how it is kept constant.
## 3. Procedure (numbered, one action per step)
3) Set up the apparatus as shown in Fig. X / the diagram.
4) Measure the independent variable x using … (name the instrument and what it is measured between).
5) Measure the dependent variable y using … Repeat and calculate the average.
6) Repeat steps 4 to 5 for 8 different values of x.
7) Keep … constant by … (one step for each controlled variable, saying how).
## 4. Analysis (proving the relationship)
8) Plot a graph of Y against X (the straight-line form of the relationship).
9) If the relationship is valid, the graph will be a straight line (passing through the origin) with gradient = … and y-intercept = …
10) For y = kxⁿ: lg y = n lg x + lg k. Plot lg y against lg x: n = gradient and k = 10^(y-intercept).
11) For y = Ae^(−kx): ln y = ln A − kx. Plot ln y against x: k = −gradient.
## 5. Precautions for accuracy
12) Take preliminary readings to determine a suitable range of x (and number of oscillations / timing interval), so that the percentage uncertainty is small.
13) Repeat each reading and average; use a fiducial marker; read scales at eye level to avoid parallax; wait for readings to settle.
## 6. Safety
14) Name the specific hazard and the precaution (e.g. goggles in case a wire or rubber band snaps, sand tray under masses, heat-resistant gloves for hot water, discharge capacitors before handling).
'''


def svg_page(body, page_no=None):
    foot = ''
    if page_no:
        foot = (f'<text x="{X0}" y="{H - 24:.0f}" font-size="7.5" fill="{GREY}">Virtual Physics Lab · planning questions · suggested answers (unofficial)</text>'
                f'<text x="{W - X0:.0f}" y="{H - 24:.0f}" font-size="7.5" fill="{GREY}" text-anchor="end">{page_no}</text>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}pt" height="{H}pt" viewBox="0 0 {W} {H}" '
            f'font-family="DejaVu Sans, sans-serif"><rect width="{W}" height="{H}" fill="#fff"/>{body}{foot}</svg>')


def to_pdf(svg):
    return PdfReader(io.BytesIO(cairosvg.svg2pdf(bytestring=svg.encode()))).pages[0]


def crop_png(school, page, top, bottom, left=None, right=None):
    src = os.path.join(PRIV, 'src', f'{school}.pdf')
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['pdftoppm', '-r', '150', '-png', '-singlefile', '-f', str(page), '-l', str(page), src, os.path.join(d, 'p')],
                       check=True, capture_output=True)
        from PIL import Image
        im = Image.open(os.path.join(d, 'p.png')).convert('L')
        s = im.height / float(PdfReader(src).pages[page - 1].mediabox.height)
        im = im.crop((int((left or 0) * s), int(top * s), int(right * s) if right else im.width, int(bottom * s)))
        # trim white margins left/right
        bbox = Image.eval(im, lambda v: 255 - v).getbbox()
        if bbox:
            im = im.crop((max(0, bbox[0] - 10), 0, min(im.width, bbox[2] + 10), im.height))
        buf = io.BytesIO()
        im.save(buf, 'PNG')
        return base64.b64encode(buf.getvalue()).decode(), im.width / s, im.height / s


class Flow:
    """Writes answer-key content down A4 pages, starting a new page when one fills up."""
    def __init__(self, header):
        self.pages, self.header = [], header
        self.new()

    def new(self):
        self.g = SVG()
        self.pages.append(self.g)
        self.y = 56
        if len(self.pages) > 1:
            self.g.text(X0, 40, self.header + ' (continued)', 8.5, color=GREY)

    def need(self, h):
        if self.y + h > H - 50:
            self.new()


def answer_pages(n, key):
    pl, ex = PLANS[key], EXTRA.get(key, {})
    s = pl['school']
    head = f'{s.upper()} {pl["part"]}'
    F = Flow(head)
    g = F.g
    g.rect(X0 - 8, 30, XW + 16, 48, fill='#eef3fd', color='#eef3fd')
    g.text(X0, 47, f'{n}.  {NAMES[s]} · 2026 Prelim · Question {pl["part"]} · [{pl["marks"]} marks]', 9, color=GREY)
    t = f'Answer key: {pl["title"]}'
    g.text(X0, 68, t, min(13, 13 * XW / tw(t, 13, True)), bold=True, color=DARK)
    F.y = 96
    if ex.get('context'):
        for ln in wrap('Context: ' + ex['context'], XW, 9):
            F.g.text(X0, F.y, ln, 9, italic=True, color=GREY)
            F.y += 12.5
        F.y += 6
    for fig in ex.get('figs', []):
        pg, top, bot, cap = fig[:4]
        b64, fw, fh = crop_png(s, pg, top, bot, *fig[4:])
        sc = min(1.0, 300 / fw, 170 / fh)
        w, h = fw * sc, fh * sc
        F.need(h + 24)
        F.g.text(X0, F.y + 2, 'From the question paper: ' + cap, 8.5, color=GREY)
        F.g.add(f'<image x="{X0 + (XW - w) / 2:.1f}" y="{F.y + 8:.1f}" width="{w:.1f}" height="{h:.1f}" xlink:href="data:image/png;base64,{b64}"/>')
        F.y += h + 22
    if pl.get('diagram'):
        d = pl['diagram']
        sc = min(1.0, (XW - 40) / d['w'], 250 / d['h'])
        bw, bh = d['w'] * sc, d['h'] * sc
        F.need(bh + 50)
        F.g.text(X0, F.y + 2, 'Diagram', 10.5, bold=True, color=BLUE)
        F.g.rect(X0 - 4, F.y + 10, XW + 8, bh + 34, color=RULE, fill='none')
        F.g.add(item_svg(dict(t='diagram', x=X0 + (XW - bw) / 2 + 10 * sc, y=F.y + 30, els=d['els'], scale=sc)))
        F.y += bh + 56
    size, lh = 9.6, 13.6
    rows = plan_rows(pl['text'], XW, size)
    for row in rows:
        heading = len(row) == 1 and row[0][2]
        F.need(lh + (6 if heading else 0))
        if heading and F.y > 110:
            F.y += 5
        for dx, txt, bold in row:
            F.g.text(X0 + dx, F.y, txt, size + (0.6 if bold else 0), bold=bold, color=BLUE)
        F.y += lh
    if pl.get('notes'):
        F.y += 10
        lines = []
        for kind, txt in pl['notes']:
            lab = {'mark': 'Marking points', 'why': 'Why', 'tip': 'Tip', 'warn': 'Watch out'}[kind]
            lines += [(True, lab)] + [(False, l) for l in wrap(txt, XW - 16, 8.8)]
        F.need(len(lines) * 12 + 16)
        F.g.rect(X0 - 4, F.y - 10, XW + 8, len(lines) * 12 + 10, color='#f3e2b8', fill='#fff8e6')
        for bold, l in lines:
            F.g.text(X0 + 4, F.y + 1, l, 8.8, bold=bold, color='#7a5200' if bold else DARK)
            F.y += 12
    return F.pages


def stamp(page, text):
    w, h = float(page.mediabox.width), float(page.mediabox.height)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}pt" height="{h}pt" viewBox="0 0 {w} {h}" font-family="DejaVu Sans, sans-serif">'
           f'<rect x="18" y="8" width="{tw(text, 8.5, True) + 16:.1f}" height="17" rx="3" fill="{BLUE}"/>'
           f'<text x="26" y="20" font-size="8.5" font-weight="bold" fill="#fff">{esc(text)}</text></svg>')
    page.merge_page(PdfReader(io.BytesIO(cairosvg.svg2pdf(bytestring=svg.encode()))).pages[0])
    return page


def cover(entries):
    g = SVG()
    g.rect(0, 0, W, 210, fill='#1d2a44', color='#1d2a44')
    g.text(X0, 80, 'VIRTUAL PHYSICS LAB', 11, bold=True, color='#9fb6e8')
    g.text(X0, 118, 'Planning Questions', 30, bold=True, color='#ffffff')
    g.text(X0, 150, 'with numbered answer keys', 16, color='#dbe5fb')
    g.text(X0, 182, 'H2 Physics 9478 Paper 4 · 2026 JC2 Preliminary Examinations · 10 schools, 15 questions', 9.5, color='#c3d1f2')
    y = 250
    g.text(X0, y, 'Contents', 13, bold=True, color=DARK)
    y += 22
    for n, key, page in entries:
        pl = PLANS[key]
        g.text(X0, y, f'{n:>2}.', 9.5, color=GREY)
        g.text(X0 + 22, y, f'{pl["school"].upper()} {pl["part"]}', 9.5, bold=True, color=DARK)
        g.text(X0 + 110, y, pl['title'], 9.5, color=DARK)
        g.text(W - X0, y, str(page), 9.5, color=GREY, anchor='end')
        g.line(X0, y + 5, W - X0, y + 5, 0.3, RULE)
        y += 21
    y += 14
    for ln in wrap('Each question is reproduced from the original paper, followed by a suggested answer key in the numbered style used in school '
                   'mark schemes: "Set up the apparatus as shown…", 8 readings, control of variables, preliminary readings, and "if the relationship '
                   'is valid, the graph will be a straight line…". Page 2 is a one-page planning template. Answers are suggestions, not official mark schemes.', XW, 9):
        g.text(X0, y, ln, 9, color=GREY)
        y += 13
    return svg_page(g.str())


def template_page():
    g = SVG()
    g.text(X0, 60, 'How to write a planning answer', 18, bold=True, color=DARK)
    g.text(X0, 80, 'The structure and phrasing used in all the answer keys that follow.', 9.5, color=GREY)
    y = 108
    for row in plan_rows(TEMPLATE, XW, 9.8):
        heading = len(row) == 1 and row[0][2]
        if heading:
            y += 7
        for dx, txt, bold in row:
            g.text(X0 + dx, y, txt, 9.8 + (1 if bold else 0), bold=bold, color=BLUE if not bold else DARK)
        y += 14.2
    return svg_page(g.str(), 2)


def main(out):
    body, entries, page_no = [], [], 3
    for n, key in enumerate(ORDER, 1):
        pl = PLANS[key]
        src = PdfReader(os.path.join(PRIV, 'src', f'{pl["school"]}.pdf'))
        entries.append((n, key, page_no))
        qp = pl['qpages'][0]
        body.append(stamp(src.pages[qp - 1], f'{n}. {pl["school"].upper()} {pl["part"]} · question (page {qp} of the paper)'))
        page_no += 1
        for g in answer_pages(n, key):
            body.append(to_pdf(svg_page(g.str(), page_no)))
            page_no += 1
    w = PdfWriter()
    w.add_page(to_pdf(cover(entries)))
    w.add_page(to_pdf(template_page()))
    for p in body:
        w.add_page(p)
    w.add_metadata({'/Title': 'Virtual Physics Lab – Planning questions with answer keys (2026 H2 Physics 9478 Paper 4 prelims)'})
    with open(out, 'wb') as f:
        w.write(f)
    print(out, len(w.pages), 'pages')


if __name__ == '__main__':
    main(sys.argv[1])
