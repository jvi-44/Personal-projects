"""Usage: python3 tools/sheet.py PDF out.png page [page...] -> side-by-side render at 70 dpi"""
import subprocess, sys, os, tempfile
from PIL import Image
pdf, out, pages = sys.argv[1], sys.argv[2], [int(p) for p in sys.argv[3:]]
ims = []
with tempfile.TemporaryDirectory() as d:
    for p in pages:
        subprocess.run(['pdftoppm', '-r', '70', '-png', '-singlefile', '-f', str(p), '-l', str(p), pdf, os.path.join(d, 'p')], check=True)
        ims.append(Image.open(os.path.join(d, 'p.png')).copy())
w = sum(i.width for i in ims); h = max(i.height for i in ims)
o = Image.new('RGB', (w, h), 'white'); x = 0
for i in ims:
    o.paste(i, (x, 0)); x += i.width
o.save(out)
