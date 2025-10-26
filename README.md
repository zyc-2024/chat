## Introductions

This is the chatting website I've made.

Github copilot has helped me for completing some of the codes.

## How to deploy in your own device
sources in `/src`
### build.py
```python
import webview
import os
import ctypes
html_path = os.path.join(os.path.dirname(__file__), 'src', 'index.html')
webview.create_window("zyc's chatting website (exe ver.)", html_path)
if os.name == 'nt':
    try:
        SW_HIDE = 0
        hwnd = ctypes.windll.kernel32.GetConsoleWindow()
        if hwnd:
            ctypes.windll.user32.ShowWindow(hwnd, SW_HIDE)
    except Exception:
        pass
webview.start()
```

### build.bat
```batch
@echo off
pyinstaller --onefile --add-data "chat;chat" build.py
rd /s /q build
del /f /q build.spec
move .\dist\build.exe .\
rd /s /q dist
```

## Updating queues

-   [x] Fixing possible bugs
-   [x] Merge two types
-   [x] Add a link to "issues"
-   [ ] Replace Gitee by Github
-   [x] Markdown support
-   [x] Largify the buttons
