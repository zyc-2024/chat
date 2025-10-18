@echo off
setlocal enabledelayedexpansion
title ������̬ Flask Ӧ��

REM ����ű�����Ŀ¼
cd /d "%~dp0"

echo [1/4] �������⻷��...
python -m venv .venv
call .venv\Scripts\activate

echo [2/4] ��װ����...
python -m pip install --upgrade pip
pip install flask pyinstaller

echo [3/4] ���������嵥...
pip freeze > requirements.txt

echo [4/4] ���Ӧ��...
REM ע�⣺PyInstaller �� --add-data ������ Windows �÷ֺŷָ�·��
pyinstaller --noconfirm --onefile --add-data ".;." dev.py

if %errorlevel% neq 0 (
    echo ���ʧ�ܣ�
    pause
    exit /b %errorlevel%
)

echo [5/5] �ƶ�������...
REM ��� app.exe �������ƶ�����Ŀ¼
if exist dist\dev.exe (
    move /Y dist\dev.exe .
)

REM ɾ����ʱĿ¼�������ڣ�
if exist build rd /s /q build
if exist dist rd /s /q dist
if exist .venv rd /s /q .venv
if exist dev.spec del /f /q dev.spec
if exist requirements.txt del /f /q requirements.txt

echo ������ɣ�
echo.
echo ���ɵĿ�ִ���ļ�: %cd%\dev.exe
echo.

pause
