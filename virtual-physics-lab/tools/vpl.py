"""Virtual Physics Lab build library.

One annotation spec per paper drives three outputs:
  * an SVG overlay per page (inlined by the web app, answers individually revealable)
  * an annotated PDF (original page + blue answers + a notes column on the right)
  * page images of the original paper for the web viewer
plus helpers for the practice spreadsheets.
"""
import html, io, json, math, os, re, subprocess
from PIL import ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRIV = os.path.join(ROOT, 'private')
APP = os.path.join(ROOT, 'app')
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONT_B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
INK = '#1550c8'        # answer blue
NOTE_W = 210           # width of notes column in the annotated PDF (pt)
_fonts = {}


def tw(s, size, bold=False):
    key = (size, bold)
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(FONT_B if bold else FONT, size=max(1, round(size * 4)))
    return _fonts[key].getlength(s) / 4


def wrap(text, width, size, bold=False):
    out = []
    for para in text.split('\n'):
        words, line = para.split(' '), ''
        for w in words:
            t = (line + ' ' + w).strip()
            if line and tw(t, size, bold) > width:
                out.append(line)
                line = w
            else:
                line = t
        out.append(line)
    return out


def esc(s):
    return html.escape(str(s), quote=True)


# ---------- number formatting ----------

def sf(x, n):
    """Format x to n significant figures (keeps trailing zeros)."""
    if x == 0:
        return '0' if n == 1 else '0.' + '0' * (n - 1)
    d = n - 1 - int(math.floor(math.log10(abs(x))))
    v = hu(x, d)
    if d > 0:
        return f'{v:.{d}f}'.replace('-', '−')
    return f'{int(round(v))}'.replace('-', '−')


def dp(x, n):
    return f'{x:.{n}f}'


def sci(x, n):
    """x in a × 10^b form using unicode superscripts, n s.f."""
    if x == 0:
        return '0'
    e = int(math.floor(math.log10(abs(x))))
    m = x / 10 ** e
    if round(abs(m), n - 1) >= 10:
        e += 1
        m = x / 10 ** e
    return f'{m:.{n-1}f} × 10{sup(e)}'


def num(x, n=3):
    """Plain decimal for moderate magnitudes, a × 10ⁿ otherwise (n s.f.)."""
    if x == 0:
        return '0'
    if 1e-3 <= abs(x) < 1e5:
        return sf(x, n)
    return sci(x, n)


def eqn(m, c, n=4, var='x', r2=None):
    """Trendline text like the spreadsheet shows: y = mx + c."""
    s = f'y = {num(m, n)}{var} {"−" if c < 0 else "+"} {num(abs(c), n)}'
    if r2 is not None:
        s += f'\nR² = {r2:.4f}'
    return s


def sup(e):
    return str(e).translate(str.maketrans('-0123456789', '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'))


def linfit(xs, ys):
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    m = sxy / sxx
    c = my - m * mx
    syy = sum((y - my) ** 2 for y in ys)
    r2 = sxy * sxy / (sxx * syy) if syy else 1
    return m, c, r2


def nice_ticks(lo, hi, n=5):
    span = hi - lo
    if span <= 0:
        return [lo]
    raw = span / n
    mag = 10 ** math.floor(math.log10(raw))
    step = min((s * mag for s in (1, 2, 2.5, 5, 10) if s * mag >= raw), default=10 * mag)
    t = math.ceil(lo / step - 1e-9) * step
    out = []
    while t <= hi + 1e-9 * step:
        out.append(round(t, 12))
        t += step
    return out


def tick_label(v):
    if v == 0:
        return '0'
    a = abs(v)
    if a >= 1e4 or a < 1e-3:
        return sci(v, 2).replace(' × ', '×')
    s = f'{v:.6f}'.rstrip('0').rstrip('.')
    return s


# ---------- SVG primitives ----------

class SVG:
    def __init__(self):
        self.parts = []

    def add(self, s):
        self.parts.append(s)

    def text(self, x, y, s, size=10, anchor='start', bold=False, italic=False, color=INK, cls=''):
        st = ' font-weight="bold"' if bold else ''
        st += ' font-style="italic"' if italic else ''
        self.add(f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" text-anchor="{anchor}" fill="{color}"{st}>{esc(s)}</text>')

    def line(self, x1, y1, x2, y2, w=0.9, color=INK, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ''
        self.add(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" stroke-width="{w}"{d}/>')

    def poly(self, pts, w=0.9, color=INK, close=False, fill='none', dash=None):
        d = ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
        tag = 'polygon' if close else 'polyline'
        da = f' stroke-dasharray="{dash}"' if dash else ''
        self.add(f'<{tag} points="{d}" fill="{fill}" stroke="{color}" stroke-width="{w}"{da}/>')

    def rect(self, x, y, w, h, sw=0.9, color=INK, fill='none', dash=None):
        da = f' stroke-dasharray="{dash}"' if dash else ''
        self.add(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{fill}" stroke="{color}" stroke-width="{sw}"{da}/>')

    def circle(self, x, y, r, sw=0.9, color=INK, fill='none'):
        self.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{fill}" stroke="{color}" stroke-width="{sw}"/>')

    def arrow(self, x1, y1, x2, y2, w=0.9, color=INK, both=False):
        self.line(x1, y1, x2, y2, w, color)
        self._head(x1, y1, x2, y2, color)
        if both:
            self._head(x2, y2, x1, y1, color)

    def _head(self, x1, y1, x2, y2, color):
        a = math.atan2(y2 - y1, x2 - x1)
        L = 5
        p1 = (x2 - L * math.cos(a - 0.4), y2 - L * math.sin(a - 0.4))
        p2 = (x2 - L * math.cos(a + 0.4), y2 - L * math.sin(a + 0.4))
        self.poly([p1, (x2, y2), p2], close=True, fill=color, color=color, w=0.6)

    def str(self):
        return ''.join(self.parts)


# ---------- annotation items (each renders into an SVG group) ----------

def _text_block(g, x, y, s, size, width=None, lh=None, bold=False):
    lh = lh or size * 1.3
    lines = wrap(s, width, size, bold) if width else s.split('\n')
    for i, ln in enumerate(lines):
        g.text(x, y + size + i * lh, ln, size, bold=bold)
    return len(lines) * lh


def item_svg(it):
    g = SVG()
    t = it['t']
    if t == 'text':
        _text_block(g, it['x'], it['y'], it['s'], it.get('size', 10), it.get('w'), it.get('lh'), it.get('bold', False))
    elif t == 'lines':
        # write onto dotted answer lines; y = top of first dotted line text row
        size = it.get('size', 9.5)
        lh = it.get('lh', 25.3)
        lines = wrap(it['s'], it['w'], size)
        for i, ln in enumerate(lines):
            g.text(it['x'], it['y'] + 8 + i * lh, ln, size)
    elif t == 'para':
        # dense paragraph in open space (planning answers)
        size = it.get('size', 8.6)
        lh = it.get('lh') or size * 1.28
        yy = it['y']
        for block in it['s'].split('\n'):
            bold = False
            if block.startswith('**'):
                lab, _, rest = block[2:].partition('**')
                g.text(it['x'], yy + size, lab, size, bold=True)
                yy += lh
                block = rest.lstrip(': ').strip()
                if not block:
                    continue
            bullet = block.startswith('• ')
            ind = 9 if bullet else 0
            lines = wrap(block[2:] if bullet else block, it['w'] - ind, size, bold)
            for j, ln in enumerate(lines):
                if bullet and j == 0:
                    g.text(it['x'], yy + size, '•', size)
                g.text(it['x'] + ind, yy + size, ln, size, bold=bold)
                yy += lh
            yy += lh * 0.25
    elif t == 'table':
        _table(g, it)
    elif t == 'graph':
        _graph(g, it)
    elif t == 'diagram':
        _diagram(g, it)
    elif t == 'grid':
        # data drawn onto a printed grid: rect (X0,Y0)-(X1,Y1) in pt maps xr × yr
        X0, Y0, X1, Y1 = it['rect']
        xr, yr = it['xr'], it['yr']
        sx = lambda v: X0 + (v - xr[0]) / (xr[1] - xr[0]) * (X1 - X0)
        sy = lambda v: Y1 - (v - yr[0]) / (yr[1] - yr[0]) * (Y1 - Y0)
        for px_, py_ in it.get('pts', []):
            X, Y = sx(px_), sy(py_)
            g.line(X - 2.6, Y - 2.6, X + 2.6, Y + 2.6, 1.0); g.line(X - 2.6, Y + 2.6, X + 2.6, Y - 2.6, 1.0)
        if it.get('curve'):
            g.poly([(sx(a), sy(b)) for a, b in it['curve']], w=1.1)
        for seg in it.get('segs', []):
            (a1, b1), (a2, b2) = seg[:2]
            g.line(sx(a1), sy(b1), sx(a2), sy(b2), 1.0, dash=seg[2] if len(seg) > 2 else None)
        for tx in it.get('labels', []):
            g.text(sx(tx[0]), sy(tx[1]), tx[2], tx[3] if len(tx) > 3 else 8.5)
    elif t == 'box':
        g.rect(it['x'], it['y'], it['w'], it['h'], dash=it.get('dash'))
    return g.str()


def _table(g, it):
    size = it.get('size', 9)
    cols, rows = it['cols'], it['rows']
    pad = 5
    cw = it.get('cw') or None
    if not cw:
        cw = []
        for j, c in enumerate(cols):
            w = max([tw(c, size, True)] + [tw(str(r[j]), size) for r in rows]) + 2 * pad
            cw.append(max(w, 34))
    rh = it.get('rh') or size * 1.9
    x0, y0 = it['x'], it['y']
    W = sum(cw)
    H = rh * (len(rows) + 1)
    g.rect(x0, y0, W, H, sw=0.8)
    g.line(x0, y0 + rh, x0 + W, y0 + rh, 0.8)
    xx = x0
    for j, c in enumerate(cols):
        if j:
            g.line(xx, y0, xx, y0 + H, 0.6)
        g.text(xx + cw[j] / 2, y0 + rh * 0.66, c, size, anchor='middle', bold=True)
        for i, r in enumerate(rows):
            g.text(xx + cw[j] / 2, y0 + rh * (i + 1.66), str(r[j]), size, anchor='middle')
        xx += cw[j]
    for i in range(1, len(rows)):
        g.line(x0, y0 + rh * (i + 1), x0 + W, y0 + rh * (i + 1), 0.3, dash='2,2')


def _graph(g, it):
    x, y, w, h = it['x'], it['y'], it['w'], it['h']
    size = it.get('size', 8)
    L, B = x + 40, y + h - 26          # axes origin (left/bottom inside box)
    R, T = x + w - 10, y + 12
    xr, yr = it['xr'], it['yr']
    sx = lambda v: L + (v - xr[0]) / (xr[1] - xr[0]) * (R - L)
    sy = lambda v: B - (v - yr[0]) / (yr[1] - yr[0]) * (B - T)
    # light grid
    for tv in nice_ticks(*xr, it.get('nx', 5)):
        X = sx(tv)
        g.line(X, B, X, T, 0.25, dash='1,2')
        g.line(X, B, X, B + 3, 0.7)
        g.text(X, B + 11, tick_label(tv), size - 1, anchor='middle')
    for tv in nice_ticks(*yr, it.get('ny', 5)):
        Y = sy(tv)
        g.line(L, Y, R, Y, 0.25, dash='1,2')
        g.line(L - 3, Y, L, Y, 0.7)
        g.text(L - 5, Y + 3, tick_label(tv), size - 1, anchor='end')
    g.arrow(L, B, R + 6, B)
    g.arrow(L, B, L, T - 8)
    g.text(R + 4, B + 22, it['xlabel'], size, anchor='end', italic=False)
    g.text(L + 4, T - 5, it['ylabel'], size)
    clip = lambda X, Y: L - 1 <= X <= R + 1 and T - 1 <= Y <= B + 1
    for series in it.get('series', []):
        mk = series.get('mark', 'x')
        for px, py in series['pts']:
            X, Y = sx(px), sy(py)
            if mk == 'x':
                g.line(X - 2.6, Y - 2.6, X + 2.6, Y + 2.6, 0.9)
                g.line(X - 2.6, Y + 2.6, X + 2.6, Y - 2.6, 0.9)
            elif mk == 'dot':
                g.circle(X, Y, 1.1, fill=INK, sw=0.3)
            elif mk == 'o':
                g.circle(X, Y, 2.4)
        if series.get('join'):
            g.poly([(sx(a), sy(b)) for a, b in series['pts']], w=0.9, dash=series.get('dash'))
    for ln in it.get('lines', []):
        m, c = ln['m'], ln['c']
        a, b = ln.get('x', xr)
        pts = []
        for k in range(41):
            xv = a + (b - a) * k / 40
            yv = m * xv + c
            if yr[0] - 1e-12 <= yv <= yr[1] + 1e-12:
                pts.append((sx(xv), sy(yv)))
        if len(pts) > 1:
            g.poly(pts, w=1.0, dash=ln.get('dash'))
            if ln.get('label'):
                lx, ly = pts[-1]
                g.text(lx + 3, ly + (ln.get('ldy', -3)), ln['label'], size + 1, bold=True)
    for cv in it.get('curves', []):
        pts = [(sx(a), sy(b)) for a, b in cv['pts']]
        g.poly(pts, w=1.0, dash=cv.get('dash'))
        if cv.get('label'):
            lx, ly = pts[cv.get('li', -1)]
            g.text(lx + 3, ly - 3, cv['label'], size, bold=cv.get('bold', False))
    for tx in it.get('notes', []):
        g.text(tx[0], tx[1], tx[2], tx[3] if len(tx) > 3 else size)
    if it.get('eq'):
        ex, ey = it.get('eqpos', (L + 8, T + 4))
        for k, ln in enumerate(it['eq'].split('\n')):
            g.text(ex, ey + 9 + k * (size + 3), ln, size + 0.5)


# circuit / apparatus symbols for planning diagrams. Coordinates relative to item x,y.
def _diagram(g, it):
    ox, oy, sc = it['x'], it['y'], it.get('scale', 1)
    P = lambda a, b: (ox + a * sc, oy + b * sc)
    for el in it['els']:
        k = el[0]
        if k == 'wire':
            g.poly([P(a, b) for a, b in el[1]])
        elif k == 'dash':
            g.poly([P(a, b) for a, b in el[1]], dash='3,2')
        elif k == 'text':
            x, y = P(el[1], el[2])
            g.text(x, y, el[3], (el[4] if len(el) > 4 else 8.5) * max(sc, 0.85), anchor=el[5] if len(el) > 5 else 'start')
        elif k == 'rect':
            x, y = P(el[1], el[2])
            g.rect(x, y, el[3] * sc, el[4] * sc, fill=el[5] if len(el) > 5 else 'none')
        elif k == 'circle':
            x, y = P(el[1], el[2])
            g.circle(x, y, el[3] * sc)
        elif k == 'arrow':
            x1, y1 = P(el[1], el[2]); x2, y2 = P(el[3], el[4])
            g.arrow(x1, y1, x2, y2, both=len(el) > 5 and el[5])
        elif k == 'line':
            x1, y1 = P(el[1], el[2]); x2, y2 = P(el[3], el[4])
            g.line(x1, y1, x2, y2)
        elif k in ('R', 'C', 'cell', 'A', 'V', 'S', 'lamp', 'Rv', 'coil'):
            _symbol(g, k, *P(el[1], el[2]), el[3], el[4] if len(el) > 4 else '')


def _symbol(g, k, x, y, orient, label):
    """Symbol centred at (x,y), spanning 30pt along orient ('h' or 'v'); leads included."""
    h = orient == 'h'
    def pt(a, b):  # a along, b across
        return (x + a, y + b) if h else (x + b, y + a)
    if k in ('R', 'Rv'):
        g.poly([pt(-15, 0), pt(-9, 0)]); g.poly([pt(9, 0), pt(15, 0)])
        g.poly([pt(-9, -4), pt(9, -4), pt(9, 4), pt(-9, 4)], close=True)
        if k == 'Rv':
            g.arrow(*pt(-10, 8), *pt(10, -8))
    elif k == 'C':
        g.poly([pt(-15, 0), pt(-2, 0)]); g.poly([pt(2, 0), pt(15, 0)])
        g.poly([pt(-2, -7), pt(-2, 7)], w=1.3); g.poly([pt(2, -7), pt(2, 7)], w=1.3)
    elif k == 'cell':
        g.poly([pt(-15, 0), pt(-2, 0)]); g.poly([pt(2, 0), pt(15, 0)])
        g.poly([pt(-2, -8), pt(-2, 8)], w=0.9); g.poly([pt(2, -4), pt(2, 4)], w=2)
    elif k in ('A', 'V'):
        g.poly([pt(-15, 0), pt(-7, 0)]); g.poly([pt(7, 0), pt(15, 0)])
        g.circle(x, y, 7)
        g.text(x, y + 3.2, k, 8.5, anchor='middle')
    elif k == 'S':
        g.poly([pt(-15, 0), pt(-6, 0)]); g.poly([pt(6, 0), pt(15, 0)])
        g.circle(*pt(-6, 0), 1.2); g.circle(*pt(6, 0), 1.2)
        g.poly([pt(-6, 0), pt(6, -6)])
    elif k == 'lamp':
        g.poly([pt(-15, 0), pt(-7, 0)]); g.poly([pt(7, 0), pt(15, 0)])
        g.circle(x, y, 7)
        g.line(*pt(-5, -5), *pt(5, 5)); g.line(*pt(-5, 5), *pt(5, -5))
    elif k == 'coil':
        g.poly([pt(-15, 0), pt(-10, 0)]); g.poly([pt(10, 0), pt(15, 0)])
        pts = [pt(-10 + 20 * i / 24, -5 * abs(math.sin(math.pi * i / 6))) for i in range(25)]
        g.poly(pts)
    if label:
        lx, ly = pt(0, -13) if h else pt(0, 0)
        if h:
            g.text(lx, ly, label, 8.5, anchor='middle')
        else:
            g.text(x + 12, y + 3, label, 8.5)


# ---------- Paper ----------

class Paper:
    def __init__(self, key, name, short, date, src, meta=None):
        self.key, self.name, self.short, self.date = key, name, short, date
        self.src = src
        self.items = {}     # page -> list of items
        self.notes = {}     # page -> list of {y,text,kind}
        self.questions = []
        self.meta = meta or {}
        out = subprocess.run(['pdfinfo', src], capture_output=True, text=True).stdout
        self.npages = int(re.search(r'Pages:\s+(\d+)', out).group(1))
        w, h = re.search(r'Page size:\s+([\d.]+) x ([\d.]+)', out).groups()
        self.W, self.H = float(w), float(h)

    # --- authoring helpers ---
    def add(self, page, item, q=None):
        item.setdefault('q', q)
        self.items.setdefault(page, []).append(item)
        return item

    def text(self, page, x, y, s, size=10, w=None, q=None, **kw):
        return self.add(page, dict(t='text', x=x, y=y, s=s, size=size, w=w, **kw), q)

    def fill(self, page, x, y, s, size=10.5, q=None):
        """Answer on a 'label = ......' line whose text top is y."""
        return self.add(page, dict(t='text', x=x, y=y - 6, s=s, size=size), q)

    def lines(self, page, x, y, w, s, size=9.5, lh=25.3, q=None):
        """Explanation written on dotted lines; y = top of the first dotted line."""
        return self.add(page, dict(t='lines', x=x, y=y - 8, w=w, s=s, size=size, lh=lh), q)

    def para(self, page, x, y, w, s, size=8.6, lh=None, q=None):
        return self.add(page, dict(t='para', x=x, y=y, w=w, s=s, size=size, lh=lh), q)

    def table(self, page, x, y, cols, rows, size=9, cw=None, rh=None, q=None):
        return self.add(page, dict(t='table', x=x, y=y, cols=cols, rows=rows, size=size, cw=cw, rh=rh), q)

    def graph(self, page, x, y, w, h, q=None, **kw):
        return self.add(page, dict(t='graph', x=x, y=y, w=w, h=h, **kw), q)

    def diagram(self, page, x, y, els, q=None, scale=1):
        return self.add(page, dict(t='diagram', x=x, y=y, els=els, scale=scale), q)

    def note(self, page, y, text, kind='tip'):
        self.notes.setdefault(page, []).append(dict(y=y, text=text, kind=kind))

    def question(self, qid, title, marks, pages, summary, sim=None, xlsx=None, skills=None):
        xl = [dict(file=x[0], desc=x[1]) if isinstance(x, (tuple, list)) else dict(file=x, desc='') for x in (xlsx or [])]
        self.questions.append(dict(id=qid, title=title, marks=marks, pages=pages, summary=summary,
                                   sim=sim, xlsx=xl, skills=skills or []))

    # --- rendering ---
    def page_svg(self, p):
        items = self.items.get(p, [])
        body = ''.join(f'<g class="ans" data-q="{esc(it.get("q") or "")}">{item_svg(it)}</g>' for it in items)
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.W:.2f} {self.H:.2f}" '
                f'font-family="DejaVu Sans, Verdana, Geneva, sans-serif">{body}</svg>')

    def notes_svg(self, p):
        """Notes column for the PDF (x from W to W+NOTE_W)."""
        g = SVG()
        X = self.W + 10
        g.rect(self.W, 0, NOTE_W, self.H, sw=0, fill='#eef3fc', color='#eef3fc')
        g.line(self.W, 0, self.W, self.H, 1.2, '#9db5e6')
        g.text(X, 26, 'NOTES', 8, bold=True, color='#6b84b8')
        g.text(X + 40, 26, f'{self.short} · suggested, unofficial', 7, color='#6b84b8')
        yy = 40
        for n in sorted(self.notes.get(p, []), key=lambda n: n['y']):
            y = max(yy, n['y'])
            label = {'tip': 'TIP', 'warn': 'WATCH OUT', 'why': 'WHY', 'mark': 'MARKS'}.get(n['kind'], 'TIP')
            col = {'warn': '#b4361f', 'mark': '#2d7a3e'}.get(n['kind'], INK)
            g.text(X, y + 8, label, 6.5, bold=True, color=col)
            lines = wrap(n['text'], NOTE_W - 22, 7.6)
            for i, ln in enumerate(lines):
                g.text(X, y + 18 + i * 9.6, ln, 7.6, color='#1d2a44')
            yy = y + 22 + len(lines) * 9.6 + 4
        return g.str()

    def build(self):
        os.makedirs(os.path.join(APP, 'papers', self.key), exist_ok=True)
        os.makedirs(os.path.join(APP, 'data'), exist_ok=True)
        os.makedirs(os.path.join(APP, 'dl'), exist_ok=True)
        self._images()
        self._pdf()
        data = dict(key=self.key, name=self.name, short=self.short, date=self.date,
                    W=self.W, H=self.H, npages=self.npages, questions=self.questions, meta=self.meta,
                    pages={str(p): dict(svg=self.page_svg(p), notes=sorted(self.notes.get(p, []), key=lambda n: n['y']))
                           for p in range(1, self.npages + 1) if p in self.items or p in self.notes})
        with open(os.path.join(APP, 'data', f'{self.key}.json'), 'w') as f:
            json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        ip = os.path.join(APP, 'data', 'index.json')
        idx = json.load(open(ip)) if os.path.exists(ip) else {}
        idx[self.key] = dict(key=self.key, name=self.name, short=self.short, date=self.date,
                             questions=[dict(id=q['id'], title=q['title'], marks=q['marks']) for q in self.questions])
        with open(ip, 'w') as f:
            json.dump(idx, f, ensure_ascii=False, indent=1)
        print(f'{self.key}: {sum(len(v) for v in self.items.values())} answers, '
              f'{sum(len(v) for v in self.notes.values())} notes')

    def _images(self):
        d = os.path.join(APP, 'papers', self.key)
        if os.path.exists(os.path.join(d, 'p01.jpg')):
            return
        subprocess.run(['pdftoppm', '-r', '110', '-gray', '-jpeg', '-jpegopt', 'quality=72',
                        self.src, os.path.join(d, 'p')], check=True)
        for fn in os.listdir(d):
            m = re.match(r'p-?(\d+)\.jpg$', fn)
            if m:
                os.rename(os.path.join(d, fn), os.path.join(d, f'p{int(m.group(1)):02d}.jpg'))

    def _pdf(self):
        import cairosvg
        from pypdf import PdfReader, PdfWriter, PageObject, Transformation
        src = PdfReader(self.src)
        out = PdfWriter()
        W2 = self.W + NOTE_W
        for i, page in enumerate(src.pages):
            p = i + 1
            svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W2:.2f}pt" height="{self.H:.2f}pt" '
                   f'viewBox="0 0 {W2:.2f} {self.H:.2f}" font-family="DejaVu Sans">'
                   f'{self.notes_svg(p)}'
                   + ''.join(item_svg(it) for it in self.items.get(p, [])) + '</svg>')
            ov = PdfReader(io.BytesIO(cairosvg.svg2pdf(bytestring=svg.encode())))
            base = PageObject.create_blank_page(width=W2, height=self.H)
            # original page may have a non-zero mediabox origin
            mb = page.mediabox
            base.merge_transformed_page(page, Transformation().translate(-float(mb.left), -float(mb.bottom)))
            base.merge_page(ov.pages[0])
            out.add_page(base)
        fn = os.path.join(APP, 'dl', f'{self.short}_P4_annotated.pdf')
        with open(fn, 'wb') as f:
            out.write(f)


# ---------- spreadsheets ----------

def hu(x, nd):
    """Round half-up as a student with a calculator would (avoids 23.47/20 = 1.17349999 -> 1.173)."""
    from decimal import Decimal, ROUND_HALF_UP
    return float(Decimal(f'{x:.10f}').quantize(Decimal(1).scaleb(-nd), rounding=ROUND_HALF_UP))


def workbook(path, title, intro, raw_cols, raw_rows, proc=None, chart=None, results=None,
             answer_note=None, extra_raw_note=None, sheet_names=('Raw data', 'Suggested solution'), raw_fmt=None):
    """Two-tab practice workbook.

    raw_cols: list of header strings; raw_rows: list of row lists.
    proc: list of (header, excel_formula_template) using {r} for the row number and column letters
          of raw data (A, B, ...). Processed columns are appended after the raw columns.
    chart: dict(x=col_index, y=col_index (1-based over all columns), title, xt, yt, trend=True, scatter_only=False)
    results: list of (label, formula or value, unit) shown beside the table on the solution tab.
    """
    from openpyxl import Workbook
    from openpyxl.chart import ScatterChart, Reference, Series
    from openpyxl.chart.trendline import Trendline
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter as L

    proc = proc or []
    wb = Workbook()
    hdr_font = Font(bold=True, color='FFFFFF')
    hdr_fill = PatternFill('solid', fgColor='2A4D8F')
    todo_fill = PatternFill('solid', fgColor='FFF4CC')
    blue = Font(color='1550C8')
    thin = Side(style='thin', color='B8C4DA')
    box = Border(left=thin, right=thin, top=thin, bottom=thin)
    nraw = len(raw_cols)
    first = 5  # header row

    def _dp(v):  # decimal places as written in the data (20.0 -> 1, 24.30 cannot be told from 24.3: use the column max)
        if isinstance(v, bool) or not isinstance(v, float):
            return 0
        t = repr(v)
        return 0 if 'e' in t else len(t.split('.')[1].rstrip('0') or '') if '.' in t else 0
    fmts = list(raw_fmt) if raw_fmt else []
    for j in range(len(fmts), nraw):
        col = [r[j] for r in raw_rows if j < len(r) and isinstance(r[j], (int, float))]
        if col and all(isinstance(v, float) for v in col):
            dp = max(max(_dp(v) for v in col), 1)
            fmts.append('0.' + '0' * dp)
        else:
            fmts.append(None)

    def head(ws, r, c, text):
        cell = ws.cell(r, c, text)
        cell.font, cell.fill = hdr_font, hdr_fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = box

    for si, name in enumerate(sheet_names):
        ws = wb.active if si == 0 else wb.create_sheet(name)
        ws.title = name
        ws['A1'] = title
        ws['A1'].font = Font(bold=True, size=14, color='1D2A44')
        ws['A2'] = intro if si == 0 else 'Suggested processing (blue = formulas). Compare your own working on the first tab.'
        ws['A2'].font = Font(italic=True, color='55617A')
        if si == 0 and extra_raw_note:
            ws['A3'] = extra_raw_note
            ws['A3'].font = Font(color='9A5B00')
        for j, c in enumerate(raw_cols):
            head(ws, first, j + 1, c)
            ws.column_dimensions[L(j + 1)].width = max(12, len(c) + 4)
        for i, row in enumerate(raw_rows):
            for j, v in enumerate(row):
                cell = ws.cell(first + 1 + i, j + 1, v)
                cell.border = box
                if isinstance(v, (int, float)) and fmts[j]:
                    cell.number_format = fmts[j]
        last = first + len(raw_rows)
        for k, pc in enumerate(proc):
            h, f = pc[0], pc[1]
            col = nraw + 1 + k
            head(ws, first, col, h)
            ws.column_dimensions[L(col)].width = max(13, len(h) + 4)
            for i in range(len(raw_rows)):
                r = first + 1 + i
                cell = ws.cell(r, col)
                cell.border = box
                if si == 0:
                    cell.fill = todo_fill
                else:
                    cell.value = f.format(r=r, r1=r + 1, first=first + 1, last=last)
                    cell.font = blue
                    cell.number_format = pc[2] if len(pc) > 2 else 'General'
        rc = nraw + len(proc) + 2
        if si == 0:
            ws.cell(first - 1, nraw + 1, 'Your processing → fill the yellow cells, then plot your own graph.' if proc else
                    'Plot your own graph from these data, then compare with the next tab.').font = Font(bold=True, color='9A5B00')
            continue
        # results block
        if results:
            head(ws, first, rc, 'Result')
            head(ws, first, rc + 1, 'Value')
            head(ws, first, rc + 2, 'Unit / note')
            ws.column_dimensions[L(rc)].width = 30
            ws.column_dimensions[L(rc + 1)].width = 16
            ws.column_dimensions[L(rc + 2)].width = 28
            for i, (lab, val, unit) in enumerate(results):
                r = first + 1 + i
                ws.cell(r, rc, lab).border = box
                c = ws.cell(r, rc + 1, val.format(first=first + 1, last=last) if isinstance(val, str) else val)
                c.font, c.border = blue, box
                ws.cell(r, rc + 2, unit).border = box
        if answer_note:
            r = first + 2 + (len(results) if results else 0)
            for k, ln in enumerate(answer_note.split('\n')):
                ws.cell(r + k, rc, ln).font = Font(italic=True, color='1D2A44')
        if chart:
            ch = ScatterChart()
            ch.title = chart.get('title')
            ch.style = 13
            ch.x_axis.title = chart.get('xt')
            ch.y_axis.title = chart.get('yt')
            ch.legend = None
            ch.height, ch.width = 9, 16
            ch.x_axis.delete = False
            ch.y_axis.delete = False
            xs = Reference(ws, min_col=chart['x'], min_row=first + 1, max_row=last)
            ys = Reference(ws, min_col=chart['y'], min_row=first, max_row=last)
            s = Series(ys, xs, title_from_data=True)
            s.marker.symbol = 'x' if not chart.get('line') else 'none'
            s.marker.size = 7
            if not chart.get('line'):
                s.graphicalProperties.line.noFill = True
            if chart.get('trend', True):
                tt = chart.get('ttype', 'linear')
                s.trendline = Trendline(trendlineType=tt, order=2 if tt == 'poly' else None, dispEq=True, dispRSqr=True)
            ch.series.append(s)
            ws.add_chart(ch, f'{L(rc)}{first + 4 + (len(results) if results else 0) + (len(answer_note.split(chr(10))) if answer_note else 0)}')
    wb.save(path)
    import base64
    with open(path + '.b64.txt', 'w') as f:
        f.write(base64.b64encode(open(path, 'rb').read()).decode())


# ---------- layout lookup (positions of answer lines in the source PDF) ----------

def _parse_layout(src):
    out = subprocess.run(['pdftotext', '-bbox-layout', src, '-'], capture_output=True, text=True).stdout
    pages = {}
    for pno, pg in enumerate(re.split(r'<page ', out)[1:], start=1):
        lines = []
        for m in re.finditer(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</line>', pg, re.S):
            words = [(float(a), float(b), float(c), float(d), html.unescape(t)) for a, b, c, d, t in
                     re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', m.group(5))]
            if words:
                lines.append(dict(x0=float(m.group(1)), y0=float(m.group(2)), x1=float(m.group(3)), y1=float(m.group(4)),
                                  words=words, text=' '.join(w[4] for w in words)))
        lines.sort(key=lambda l: (l['y0'], l['x0']))
        pages[pno] = lines
    return pages


DOTS = re.compile(r'[.…]{3,}|_{3,}')


def _norm(s):
    return re.sub(r'\s+', '', s)


def _layout(self):
    if not hasattr(self, '_lay'):
        self._lay = _parse_layout(self.src)
    return self._lay


def find(self, page, label, nth=0, after=0):
    """Return (x_of_dots, y_top) for the answer line whose text starts with label."""
    hits = []
    for ln in _layout(self)[page]:
        if ln['y0'] < after:
            continue
        nt0, nl0 = _norm(ln['text']), _norm(label)
        if nt0.startswith(nl0) or (nl0 in nt0 and DOTS.search(ln['text'])) or (nt0.endswith(nl0) and len(nt0) <= len(nl0) + 2):
            dots = [w for w in ln['words'] if DOTS.search(w[4])]
            nt, nl = _norm(ln['text']), _norm(label)
            if not dots and nt.endswith('=') and (nt.startswith(nl) or (nt.endswith(nl) and len(nt) <= len(nl) + 2)):
                hits.append((ln['x1'] + 8, ln['y0']))  # dotted line drawn as graphics after "label ="
                continue
            if dots:
                w = dots[0]
                # dotted run may be glued to the label, e.g. "=………"
                m = DOTS.search(w[4])
                frac = m.start() / max(1, len(w[4]))
                x = w[0] + (w[2] - w[0]) * frac
                hits.append((x + 3, ln['y0']))
    exact = []
    for ln in _layout(self)[page]:
        if ln['y0'] >= after and _norm(ln['text']).rstrip('[]0123456789') == _norm(label) and not any(DOTS.search(w[4]) for w in ln['words']):
            exact.append((ln['x1'] + 8, ln['y0']))
    if exact and len(exact) > nth and _norm(label).endswith('='):
        return exact[nth]
    if len(hits) <= nth:
        raise KeyError(f'{self.key} p{page}: label {label!r} not found')
    return hits[nth]


def _raster_rules(self, page):
    """Dotted/ruled answer lines drawn as graphics: find them by scanning a 72-dpi render."""
    cache = self.__dict__.setdefault('_rules', {})
    if page in cache:
        return cache[page]
    from PIL import Image
    tmp = os.path.join(PRIV, 'check', f'_r_{self.key}_{page}')
    os.makedirs(os.path.dirname(tmp), exist_ok=True)
    subprocess.run(['pdftoppm', '-r', '72', '-gray', '-png', '-singlefile', '-f', str(page), '-l', str(page), self.src, tmp], check=True)
    im = Image.open(tmp + '.png').convert('L')
    W, H = im.size
    px = im.load()
    rows = []
    for y in range(40, H - 40):
        dark = [x for x in range(30, W - 30) if px[x, y] < 170]
        if len(dark) < 120:
            continue
        runs = 1 + sum(1 for a, b in zip(dark, dark[1:]) if b - a > 1)
        span = dark[-1] - dark[0]
        dotted = runs > 60 and len(dark) / runs <= 2.6 and len(dark) < 0.75 * span
        if span > 250 and (dotted or len(dark) > 0.95 * span):
            rows.append((y, dark[0], dark[-1]))
    out = []
    for y, x0, x1 in rows:
        if out and y - out[-1][3] <= 2:
            out[-1][3] = y
            continue
        out.append([x0, y, x1, y])
    sx, sy = self.W / W, self.H / H
    res = [(a * sx, (b + d) / 2 * sy - 9, c * sx) for a, b, c, d in out]
    cache[page] = res
    return res


def dotlines(self, page, after=0, before=1e9, x_min=0):
    """y_top of every pure dotted line on a page in (after, before)."""
    ys = []
    for ln in _layout(self)[page]:
        if after < ln['y0'] < before and DOTS.search(ln['text']) and len(DOTS.sub('', ln['text']).replace('[', '').replace(']', '').strip()) <= 3 and ln['x0'] >= x_min:
            ys.append((ln['x0'], ln['y0'], ln['x1'], ln['y0'] + 0.6 * (ln['y1'] - ln['y0'])))  # last = y of the dots
    if not ys:
        texty = [(ln['y0'] - 1, ln['y1'] + 1) for ln in _layout(self)[page]
                 if not DOTS.search(ln['text']) and not re.fullmatch(r'\[\d+\]|\|?\[\d+\]', ln['text'].strip())]
        ys = [(r[0], r[1], r[2], r[1] + 9) for r in _raster_rules(self, page) if after < r[1] < before and r[0] >= x_min
              and not any(a <= r[1] + 9 <= b for a, b in texty)]
    return ys


def ans(self, page, label, s, nth=0, after=0, dx=0, dy=0, size=10.5, q=None):
    x, y = self.find(page, label, nth, after)
    return self.fill(page, x + dx, y + dy, s, size=size, q=q)


def write_lines(self, page, s, after=0, before=1e9, size=9.5, q=None, x=None, w=None, spill=False):
    """Write explanation text on the dotted lines found between after/before.
    spill=True: return the text that did not fit instead of squeezing it below."""
    dl = self.dotlines(page, after, before)
    if not dl:
        raise KeyError(f'{self.key} p{page}: no dotted lines after {after}')
    x0 = x if x is not None else dl[0][0]
    width = w if w is not None else dl[0][2] - x0 - 22
    lines = wrap(s, width, size)
    if spill and len(lines) > len(dl):
        for i, ln in enumerate(lines[:len(dl)]):
            self.add(page, dict(t='text', x=x0, y=dl[i][1] - 6.5, s=ln, size=size), q)
        return ' '.join(lines[len(dl):])
    for i, ln in enumerate(lines):
        if i < len(dl):
            self.add(page, dict(t='text', x=x0, y=dl[i][1] - 6.5, s=ln, size=size), q)
        else:  # overflow: continue below the last line at the same spacing
            step = (dl[-1][1] - dl[0][1]) / (len(dl) - 1) if len(dl) > 1 else 22
            self.add(page, dict(t='text', x=x0, y=dl[-1][1] - 6.5 + (i - len(dl) + 1) * step, s=ln, size=size), q)
    return '' if spill else (len(lines), len(dl))


Paper.find = find
Paper.dotlines = dotlines
Paper.ans = ans
Paper.write_lines = write_lines


def plan_rows(text, width, size):
    """Planning answer text -> rows. '## Heading' = bold heading; 'n) step' = numbered, hanging indent;
    '- item' = indented sub-line under the previous step; anything else = plain wrapped text."""
    rows = []
    ind = tw('00) ', size)
    for raw in text.strip().split('\n'):
        raw = raw.strip()
        if not raw:
            continue
        if raw.startswith('## '):
            rows.append([(0, raw[3:], True)])
            continue
        m = re.match(r'^(\d+\))\s+(.*)$', raw)
        if m:
            num, body = m.groups()
            for i, ln in enumerate(wrap(body, width - ind, size)):
                rows.append([(0, num, False), (ind, ln, False)] if i == 0 else [(ind, ln, False)])
            continue
        if raw.startswith('- '):
            for i, ln in enumerate(wrap(raw[2:], width - ind - 9, size)):
                rows.append([(ind, '–', False), (ind + 9, ln, False)] if i == 0 else [(ind + 9, ln, False)])
            continue
        for ln in wrap(raw, width, size):
            rows.append([(0, ln, False)])
    return rows


def flow(self, areas, text, size=8.6, q=None, width=None):
    """Lay planning text into answer areas, two rows per dotted line.
    areas: ('lines', page, after, before[, rows_per_line]) or ('box', page, x, y, w, h, lh)."""
    slots = []
    for a in areas:
        if a[0] == 'lines':
            dl = self.dotlines(a[1], a[2], a[3])
            if not dl:
                raise KeyError(f'{self.key} p{a[1]}: no dotted lines in {a}')
            sp = (dl[-1][1] - dl[0][1]) / (len(dl) - 1) if len(dl) > 1 else 27
            per = a[4] if len(a) > 4 else (2 if sp > 23 else 1)   # rows per dotted line
            w = dl[0][2] - dl[0][0] - 24
            for ln in dl:
                for j in range(per):
                    slots.append((a[1], dl[0][0], ln[3] - 2 - size + j * sp / 2, w))  # row 0 sits just on the dotted line
        else:
            _, pg, x, y, w, h, lh = a
            yy = y
            while yy + lh <= y + h + 0.1:
                slots.append((pg, x, yy, w))
                yy += lh
    width = width or min(sl[3] for sl in slots)
    rows = plan_rows(text, width, size)
    if len(rows) > len(slots):
        raise ValueError(f'{self.key}: plan needs {len(rows)} rows but only {len(slots)} slots')
    for row, (pg, x, y, w) in zip(rows, slots):
        for dx, s, bold in row:
            self.add(pg, dict(t='text', x=x + dx, y=y, s=s, size=size, bold=bold), q)
    return len(slots) - len(rows)


Paper.flow = flow
