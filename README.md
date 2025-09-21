## Introductions

This is the chatting website I've made.

Github copilot has helped me for completing some of the codes.

## How to deploy in your own device
### Requirements for pip
`pip install pyinstaller pywebview`
### Python `app.js`
```python
import webview
import http.server
import socketserver
import threading
import os
import sys
import tempfile
import shutil
import pkgutil

PORT = 8000

# 资源解压到临时目录
def extract_assets():
    temp_dir = os.path.join(tempfile.gettempdir(), "myapp")
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    os.makedirs(temp_dir, exist_ok=True)

    # 从 PyInstaller 打包后的 bundle 里提取资源
    base_path = getattr(sys, '_MEIPASS', os.path.abspath("."))
    for root, dirs, files in os.walk(base_path):
        rel_root = os.path.relpath(root, base_path)
        for f in files:
            if f.endswith((".html", ".css", ".js", ".png", ".bmp", ".txt")):
                src_path = os.path.join(root, f)
                dst_dir = os.path.join(temp_dir, rel_root)
                os.makedirs(dst_dir, exist_ok=True)
                shutil.copy2(src_path, os.path.join(dst_dir, f))

    return temp_dir

def start_server(web_dir):
    os.chdir(web_dir)
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving at http://127.0.0.1:{PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    web_dir = extract_assets()
    threading.Thread(target=start_server, args=(web_dir,), daemon=True).start()
    webview.create_window("我的应用", f"http://127.0.0.1:{PORT}/")
    webview.start()

```
### `build.bat`
```batch
pyinstaller --noconsole --onefile ^
  --add-data "index.html;." ^
  --add-data "404.html;." ^
  --add-data "changelog.html;." ^
  --add-data "create.html;." ^
  --add-data "favicon.bmp;." ^
  --add-data "favicon.png;." ^
  --add-data "private.html;." ^
  --add-data "public.html;." ^
  --add-data "uf.html;." ^
  --add-data "version.txt;." ^
  --add-data "css;css" ^
  --add-data "js;js" ^
  app.py

```

PS: You can just download the binary file in releases section since it was also generated using `build.bat`

## Updating queues

-   [x] Fixing possible bugs
-   [x] Merge two types
-   [x] Add a link to "issues"
-   [ ] Replace Gitee by Github
-   [x] Largify the buttons
