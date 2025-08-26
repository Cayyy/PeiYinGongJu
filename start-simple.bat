@echo off
chcp 65001 >nul
echo Starting Dubbing Tool Development Environment...
echo.
echo Installing dependencies...
call npm install
echo.
echo Starting development server and Electron...
call npm run electron-dev
pause
