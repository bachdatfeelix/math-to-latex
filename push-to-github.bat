@echo off
title Push Math2LaTeX to GitHub (bachdatfeelix)
color 0b
echo ========================================================
echo       PUSH CODE LEN GITHUB: bachdatfeelix/math-to-latex
echo ========================================================
echo.
cd /d "%~dp0"

echo [*] Dang kiem tra git status...
git status
echo.

echo [*] Dang thuc hien: git push -u origin main...
git push -u origin main

echo.
if %errorlevel% equ 0 (
    color 0a
    echo [OK] PUSH CODE LEN GITHUB THANH CONG!
    echo [!] Xem repository tai: https://github.com/bachdatfeelix/math-to-latex
) else (
    color 0c
    echo [X] CO LOI XAY RA KHI PUSH!
    echo [!] Neu bao "Repository not found", ban hay vao https://github.com/new tao repo ten "math-to-latex" truoc nhe.
)

echo.
pause
