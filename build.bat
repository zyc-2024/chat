@echo off
setlocal enabledelayedexpansion
title ������̬ Flask Ӧ�ã�����ģʽ��

cd /d "%~dp0"

echo [1/5] �������⻷��...
python -m venv .venv
call .venv\Scripts\activate

echo [2/5] ��װ�������廪����...
python -m pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install flask pyinstaller -i https://pypi.tuna.tsinghua.edu.cn/simple

echo [3/5] ���������嵥...
pip freeze > requirements.txt

echo [4/5] ���Ӧ��...
pyinstaller --noconfirm --onefile --add-data ".;." app.py

if %errorlevel% neq 0 (
    echo ���ʧ�ܣ�
    pause
    exit /b %errorlevel%
)

echo [5/5] ��������β...
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
echo ������ɣ���ֱ������ app.exe ��������
echo ���Զ���Ĭ����������ʣ�http://127.0.0.1:5000
pause
