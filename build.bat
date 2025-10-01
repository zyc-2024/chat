@echo off
setlocal enabledelayedexpansion

:: 设置基础命令
set CMD=pyinstaller --noconsole --onefile

:: 自动扫描当前目录下的资源文件
for %%f in (*.html *.bmp *.txt) do (
    set CMD=!CMD! --add-data "%%f;."
)

:: 扫描 css 和 js 目录（整个文件夹打进去）
if exist css (
    set CMD=!CMD! --add-data "css;css"
)
if exist js (
    set CMD=!CMD! --add-data "js;js"
)

:: 执行命令
%CMD% app.py
rmdir /s /q build
del /f /q app.spec
move dist\app.exe .
ren app.exe chat.exe
move chat.exe ..
rmdir /s /q dist