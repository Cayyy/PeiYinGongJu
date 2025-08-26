@echo off
chcp 65001 >nul
echo 启动配音工具开发环境...
echo.
echo 正在安装依赖...
call npm install
echo.
echo 启动开发服务器和Electron...
call npm run electron-dev
pause
