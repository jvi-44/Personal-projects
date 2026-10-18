"""Build a single self-contained HTML copy of the lab (no annotated PDFs) for offline use.
fetch() of relative paths is served from an embedded file table."""
import base64, json, os, re, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'app')
out = sys.argv[1]
files = {}
for d, _, fs in os.walk(ROOT):
    for f in fs:
        rel = os.path.relpath(os.path.join(d, f), ROOT)
        if rel.startswith('data/') or rel.endswith('.b64.txt'):
            files[rel] = open(os.path.join(d, f), encoding='utf-8').read()
        elif rel.startswith('papers/') and rel.endswith('.jpg'):
            files[rel] = 'data:image/jpeg;base64,' + base64.b64encode(open(os.path.join(d, f), 'rb').read()).decode()
html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
shim = ('<script>window.__FILES=' + json.dumps(files) + ';(function(){const f=window.fetch;window.fetch=function(u,o){'
        'const k=String(u).replace(/^\\.\\//,"");if(k in window.__FILES){const v=window.__FILES[k];'
        'return Promise.resolve(new Response(v,{status:200}))}'
        'if(/^dl\\//.test(k))return Promise.resolve(new Response("missing",{status:404}));return f.apply(this,arguments)}})();</script>')
def inline(m):
    src = m.group(1)
    return '<script>' + open(os.path.join(ROOT, src), encoding='utf-8').read().replace('</script>', '<\\/script>') + '</script>'
html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + shim + html + '</body></html>'
open(out, 'w', encoding='utf-8').write(html)
print(out, round(os.path.getsize(out) / 1e6, 1), 'MB')
