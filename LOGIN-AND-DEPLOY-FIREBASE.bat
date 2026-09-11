@echo off
cd /d "%~dp0"
echo ===================================================
echo     FIREBASE LOGIN & DEPLOY FOR UDAAN WEB
echo ===================================================
echo.
echo Step 1: Logging into your Firebase Account...
call npx firebase-tools login --reauth
echo.
echo Step 2: Listing your Firebase projects...
call npx firebase-tools projects:list
echo.
set /p PROJECT_ID="Enter the Firebase Project ID you want to deploy to: "
echo.
echo Step 3: Setting active project to %PROJECT_ID%...
call npx firebase-tools use %PROJECT_ID%
echo.
echo Step 4: Building production files...
call npm run build
echo.
echo Step 5: Deploying to Firebase Hosting (%PROJECT_ID%)...
call npx firebase-tools deploy --only hosting --project %PROJECT_ID%
echo.
echo ===================================================
echo     DEPLOYMENT FINISHED!
echo ===================================================
pause
