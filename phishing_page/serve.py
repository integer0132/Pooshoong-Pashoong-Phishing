import http.server
import socketserver

PORT = 8000

class WasmHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.wasm': 'application/wasm',
        '': 'application/octet-stream',
    }
    def end_headers(self):
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        super().end_headers()

with socketserver.TCPServer(("", PORT), WasmHandler) as httpd:
    print("✅ Serving on http://localhost:8000")
    httpd.serve_forever()
