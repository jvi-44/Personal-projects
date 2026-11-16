#!/usr/bin/env python3
"""Wrap app.html (the Artifact page body) into a standalone index.html you can open from any static server."""
import os, sys
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)
body = open(os.path.join(root, 'app.html'), encoding='utf8').read()
HEAD = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>:root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}'
        'body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>\n')
open(os.path.join(root, 'index.html'), 'w', encoding='utf8').write(HEAD + body + '\n</body></html>\n')
if len(sys.argv) > 1 and sys.argv[1] == '--dev':   # offline copy for tests: local three.js
    dev = body.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js', '_dev/three.min.js')
    open(os.path.join(root, 'dev.html'), 'w', encoding='utf8').write(HEAD + dev + '\n</body></html>\n')
print('index.html written', len(body))
