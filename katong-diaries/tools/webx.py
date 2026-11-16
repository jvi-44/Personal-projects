"""Condense a saved article into heading + address + first sentences (context-cheap)."""
import sys, re
from bs4 import BeautifulSoup

path = sys.argv[1]
maxp = int(sys.argv[2]) if len(sys.argv) > 2 else 260
soup = BeautifulSoup(open(path, 'rb').read(), 'lxml')
for t in soup(['script', 'style', 'noscript', 'svg', 'nav', 'footer', 'header', 'form', 'aside', 'iframe']):
    t.decompose()
root = soup.find('article') or soup.find('main') or soup.body
ADDR = re.compile(
    r'(Singapore\s+\d{6}|#\s?[B0-9]{1,3}-\s?[0-9A-Z/]{1,8}|\b\d{1,4}[A-Z]?\s+(?:[A-Z][a-z]+\s+){1,3}'
    r'(?:Road|Rd|Place|Pl|Lane|Street|St|Avenue|Ave|Walk|Parkway|Terrace|Drive|Link|Crescent|Close)\b'
    r'|Opening hours|Address)', re.I)
out = []
seen = set()
for el in root.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'li', 'td']):
    txt = ' '.join(el.get_text(' ', strip=True).split())
    if not txt or txt in seen:
        continue
    if el.name in ('h1', 'h2', 'h3', 'h4'):
        seen.add(txt)
        out.append('\n## ' + txt[:140])
    else:
        if len(txt) < 25 and not ADDR.search(txt):
            continue
        seen.add(txt)
        if ADDR.search(txt):
            if len(txt) > maxp + 150:
                out.append('  @ ' + txt[:maxp] + ' … ' + txt[-140:])
            else:
                out.append('  @ ' + txt)
        else:
            out.append('  - ' + txt[:maxp])
print('\n'.join(out))
