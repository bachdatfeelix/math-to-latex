@echo off
title MiDaTeX Launcher
color 0b
echo ========================================================
echo                MIDATEX - TOAN SANG LATEX
echo ========================================================
echo.
echo [*] Dang kiem tra dependencies...
cd /d "%~dp0"

if not exist node_modules (
    echo [*] Dang cai dat thu vien lan dau...
    npm install
)

echo [*] Dang khoi dong Web Server tai http://localhost:3000 ...
start http://localhost:3000
npm start

pause
