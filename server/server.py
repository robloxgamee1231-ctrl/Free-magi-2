#!/usr/bin/env python3
"""ndxiscracked — server-side mode.

GitHub Pages serves the static build, where the gate is a hash check in the
browser. Run this instead when you want the gate enforced on the server:

    python3 server/server.py                # http://localhost:8000
    NDXI_PORT=9000 python3 server/server.py

Login: POST /login {"password": "..."} -> HttpOnly signed session cookie.
The password is never stored here, only PBKDF2-HMAC-SHA256 of it (rotate with
the command in README.md). Standard library only, no dependencies.
"""
import hashlib
import hmac
import http.server
import json
import os
import secrets
import socketserver
import urllib.parse

PORT = int(os.environ.get("NDXI_PORT", "8000"))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Same password as the static gate. Salt + PBKDF2 digest only, never plaintext.
SERVER_SALT = os.environ.get("NDXI_SALT", "ndxi-eef4135a7febfcf4")
SERVER_HASH = os.environ.get("NDXI_HASH", "be5fe8a0e3efe82885818dd82a50e37fef004b277b9a6495b5aaeb49d2646f8b")
ITERATIONS = 200_000

# Session-signing secret. Per-process random unless NDXI_SECRET is set.
SECRET = os.environ.get("NDXI_SECRET") or secrets.token_hex(32)


def check_password(candidate: str) -> bool:
    digest = hashlib.pbkdf2_hmac(
        "sha256", candidate.encode(), SERVER_SALT.encode(), ITERATIONS
    )
    return hmac.compare_digest(digest.hex(), SERVER_HASH)


def sign(value: str) -> str:
    return hmac.new(SECRET.encode(), value.encode(), hashlib.sha256).hexdigest()[:32]


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    # --- helpers ---------------------------------------------------------
    def _cookie(self, name):
        raw = self.headers.get("Cookie", "")
        for part in raw.split(";"):
            if "=" in part:
                k, v = part.strip().split("=", 1)
                if k == name:
                    return v
        return None

    def _authed(self):
        token = self._cookie("ndxi_session")
        if not token or "." not in token:
            return False
        value, sig = token.rsplit(".", 1)
        return value == "open" and hmac.compare_digest(sign(value), sig)

    def _send_json(self, payload, status=200, cookie=None):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.end_headers()
        self.wfile.write(body)

    # --- routes ----------------------------------------------------------
    def do_POST(self):
        route = urllib.parse.urlparse(self.path).path
        length = int(self.headers.get("Content-Length") or 0)
        try:
            data = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            data = {}
        if route == "/login":
            if check_password(str(data.get("password", ""))):
                value = "open." + sign("open")
                cookie = "ndxi_session=" + value + "; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400"
                self._send_json({"ok": True}, cookie=cookie)
            else:
                self._send_json({"ok": False, "error": "Wrong key."}, status=401)
        elif route == "/logout":
            cookie = "ndxi_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
            self._send_json({"ok": True}, cookie=cookie)
        else:
            self._send_json({"error": "Not found."}, status=404)

    def do_GET(self):
        route = urllib.parse.urlparse(self.path).path
        if route == "/session":
            self._send_json({"open": self._authed()})
            return
        # Static files are served as-is; the SPA gate handles access client-side.
        super().do_GET()

    def log_message(self, fmt, *args):
        pass  # keep the console quiet


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with Server(("0.0.0.0", PORT), Handler) as httpd:
        print("ndxiscracked server-side mode on http://localhost:%d" % PORT)
        httpd.serve_forever()
