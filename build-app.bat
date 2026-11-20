@echo off
setlocal
cd /d "%~dp0"

where pnpm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] pnpm not found. Please install pnpm first.
    pause
    exit /b 1
)

set "PYTHON=python"
py -3.12 -V >nul 2>nul
if not errorlevel 1 set "PYTHON=py -3.12"
if "%PYTHON%"=="python" (
    py -3.11 -V >nul 2>nul
    if not errorlevel 1 set "PYTHON=py -3.11"
)

echo [1/3] Installing dependencies...
call pnpm install --frozen-lockfile
if errorlevel 1 goto :error

echo [2/3] Building web assets...
call pnpm build
if errorlevel 1 goto :error

echo [3/3] Building Windows executable with %PYTHON%...
%PYTHON% -m pip install --upgrade pyinstaller
if errorlevel 1 goto :error

%PYTHON% -m PyInstaller --noconfirm --clean --onefile --name zyc-chat ^
    --distpath build\app-dist --workpath build\app-work ^
    --add-data "dist;dist" app.py
if errorlevel 1 goto :error

echo.
echo Build complete: build\app-dist\zyc-chat.exe
echo Double-click the exe to run the local app.
pause
exit /b 0

:error
echo.
echo Build failed.
pause
exit /b 1
