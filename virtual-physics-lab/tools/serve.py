"""Local test server with UTF-8 content types (the artifact host serves UTF-8)."""
import functools
import http.server
import sys


class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
                      '.json': 'application/json; charset=utf-8'}

    def log_message(self, *a):
        pass


http.server.ThreadingHTTPServer(('', 8765), functools.partial(H, directory=sys.argv[1])).serve_forever()
