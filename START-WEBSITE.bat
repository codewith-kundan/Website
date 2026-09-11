@echo off
cd /d " %~dp0\
echo Starting Udaan Web Server...
call npm run dev
pause
