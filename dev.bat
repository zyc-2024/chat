@echo off
setlocal enabledelayedexpansion
title 构建静态 Flask 应用

REM 进入脚本所在目录
cd /d "%~dp0"

echo [1/4] 创建虚拟环境...
python -m venv .venv
call .venv\Scripts\activate

echo [2/4] 安装依赖...
python -m pip install --upgrade pip
pip install flask pyinstaller

echo [3/4] 生成依赖清单...
pip freeze > requirements.txt

echo [4/4] 打包应用...
REM 注意：PyInstaller 的 --add-data 参数在 Windows 用分号分隔路径
pyinstaller --noconfirm --onefile --add-data ".;." dev.py

if %errorlevel% neq 0 (
    echo 打包失败！
    pause
    exit /b %errorlevel%
)

echo [5/5] 移动并清理...
REM 如果 app.exe 存在则移动到根目录
if exist dist\dev.exe (
    move /Y dist\dev.exe .
)

REM 删除临时目录（若存在）
if exist build rd /s /q build
if exist dist rd /s /q dist
if exist .venv rd /s /q .venv
if exist dev.spec del /f /q dev.spec
if exist requirements.txt del /f /q requirements.txt

echo 构建完成！
echo.
echo 生成的可执行文件: %cd%\dev.exe
echo.

pause
