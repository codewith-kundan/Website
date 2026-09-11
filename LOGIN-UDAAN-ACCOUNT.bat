@echo off
cd /d "%~dp0"
title Firebase Deploy - Udaan
echo ====================================================
echo   LOGGING INTO FIREBASE FOR UDAAN (udaan-f8f19)
echo ====================================================
echo.
echo Step 1: When prompted below, press 'Y' and Enter to open your browser:
call npx firebase-tools login
echo.
echo Step 2: Building website...
call npm run build
echo.
echo Step 3: Deploying to udaan-f8f19...
call npx firebase-tools deploy --only hosting --project udaan-f8f19
echo.
echo ====================================================
echo   SUCCESS! Website is live on https://udaan-f8f19.web.app
echo ====================================================
pause
