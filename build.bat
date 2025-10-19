@echo off
setlocal enabledelayedexpansion
title 构建静态 Flask 应用（生产模式）

cd /d "%~dp0"

echo [1/5] 创建虚拟环境...
python -m venv .venv
call .venv\Scripts\activate

echo [2/5] 安装依赖（清华镜像）...
python -m pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install flask pyinstaller -i https://pypi.tuna.tsinghua.edu.cn/simple

echo [3/5] 生成依赖清单...
pip freeze > requirements.txt

echo [4/5] 打包应用...
pyinstaller --noconfirm --onefile --add-data ".;." app.py

if %errorlevel% neq 0 (
    echo 打包失败！
    pause
    exit /b %errorlevel%
)

echo [5/5] 清理与收尾...
if exist dist\app.exe (
    move /Y dist\app.exe .
)

if exist build rd /s /q build
if exist dist rd /s /q dist
if exist .venv rd /s /q .venv
if exist __pycache__ rd /s /q __pycache__
if exist app.spec del /f /q app.spec
if exist requirements.txt del /f /q requirements.txt

echo.
echo 构建完成！请直接运行 app.exe 启动服务。
echo 将自动打开默认浏览器访问：http://127.0.0.1:5000
pause
