@echo off
cd /d "%~dp0"
title Update Udaan Live Website
echo ====================================================
echo     BUILDING AND PUBLISHING UPDATES TO LIVE SITE
echo ====================================================
echo.
echo Step 1: Building latest website files...
call npm run build
echo.
echo Step 2: Deploying updates to Firebase Hosting...
call npx firebase-tools deploy --only hosting --project udaan-f8f19
echo.
echo ====================================================
echo   SUCCESS! Your updates are now LIVE on:
echo   - https://udaannitr.in
echo   - https://udaan-f8f19.web.app
echo ====================================================
pause
