pyinstaller --noconsole --onefile ^
  --add-data "index.html;." ^
  --add-data "404.html;." ^
  --add-data "changelog.html;." ^
  --add-data "create.html;." ^
  --add-data "favicon.bmp;." ^
  --add-data "favicon.png;." ^
  --add-data "LICENSE;." ^
  --add-data "private.html;." ^
  --add-data "public.html;." ^
  --add-data "uf.html;." ^
  --add-data "version.txt;." ^
  --add-data "css;css" ^
  --add-data "js;js" ^
  app.py

rmdir /s /q build
del /f /q app.spec
move dist\app.exe .
ren app.exe chat.exe
move app.exe /
rmdir /s /q dist