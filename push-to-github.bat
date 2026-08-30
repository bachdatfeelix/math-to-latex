@echo off
title Push Math2LaTeX to GitHub (bachdatfeelix)
color 0b
echo ========================================================
echo       PUSH CODE LEN GITHUB: bachdatfeelix/math-to-latex
echo ========================================================
echo.
cd /d "%~dp0"

echo [*] Dang them tat ca cac file thay doi (git add .)...
git add .

echo [*] Dang tao commit...
git commit -m "feat: upgrade UI, KaTeX math symbols toolbar, Pro PDF support and multi-key rotation"

echo [*] Dang day code len GitHub (git push origin main)...
git push origin main

echo.
if %errorlevel% equ 0 (
    color 0a
    echo [OK] PUSH CODE LEN GITHUB THANH CONG!
    echo [!] Xem repository tai: https://github.com/bachdatfeelix/math-to-latex
) else (
    color 0c
    echo [X] CO LOI XAY RA KHI PUSH!
    echo [!] Kiem tra lai ket noi hoac quyen truy cap GitHub nhe.
)

echo.
pause
