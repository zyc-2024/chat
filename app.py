"""本地运行版入口。

开发时先执行 `pnpm build`，再运行 `python app.py`。
打包后的 exe 会内置 `dist` 目录，启动后自动打开浏览器。
"""

from __future__ import annotations

import http.server
import mimetypes
import os
import socket
import sys
import threading
import webbrowser

APP_TITLE = "zyc2024 Chat Local"
DEFAULT_PORT = 5000

mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("font/woff", ".woff")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("font/ttf", ".ttf")
mimetypes.add_type("image/bmp", ".bmp")
mimetypes.add_type("application/json", ".json")


def resource_root() -> str:
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        return sys._MEIPASS  # type: ignore[attr-defined]
    return os.path.dirname(os.path.abspath(__file__))


STATIC_DIR = os.path.join(resource_root(), "dist")
NOT_FOUND_PAGE = os.path.join(STATIC_DIR, "404.html")


class AppRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format, *args):
        return

    def send_error(self, code, message=None, explain=None):
        if code == 404 and os.path.isfile(NOT_FOUND_PAGE):
            body = open(NOT_FOUND_PAGE, "rb").read()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().send_error(code, message, explain)


def find_free_port(start: int = DEFAULT_PORT) -> int:
    for port in range(start, start + 100):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                sock.bind(("127.0.0.1", port))
            except OSError:
                continue
            return port
    return 0


def open_browser(url: str) -> None:
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()


def main() -> int:
    if not os.path.isdir(STATIC_DIR):
        print("未找到 dist 目录。请先运行 pnpm build，或使用打包后的 exe。")
        return 1

    try:
        preferred_port = int(os.environ.get("ZY_CHAT_PORT", DEFAULT_PORT))
    except ValueError:
        preferred_port = DEFAULT_PORT
    port = find_free_port(preferred_port)
    if port == 0:
        print("没有找到可用的本地端口。")
        return 1

    url = f"http://127.0.0.1:{port}/"
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), AppRequestHandler)

    print("=" * 56)
    print(APP_TITLE)
    print(f"本地地址: {url}")
    print("按 Ctrl+C 关闭程序。")
    print("=" * 56)

    if os.environ.get("ZY_CHAT_NO_BROWSER") != "1":
        open_browser(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n正在关闭……")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
