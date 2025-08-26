# 设置控制台编码为UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "启动配音工具开发环境..." -ForegroundColor Green
Write-Host ""

Write-Host "正在安装依赖..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "启动开发服务器和Electron..." -ForegroundColor Yellow
npm run electron-dev

Write-Host "按任意键退出..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
