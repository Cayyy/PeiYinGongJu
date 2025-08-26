@echo off
chcp 65001 >nul
echo 正在清理错误的配置文件...

set CONFIG_DIR=%APPDATA%\配音工具
set CONFIG_FILE=%CONFIG_DIR%\config.json

if exist "%CONFIG_FILE%" (
    echo 删除错误的配置文件: %CONFIG_FILE%
    del "%CONFIG_FILE%"
    echo 配置文件已删除
) else (
    echo 配置文件不存在
)

echo 清理完成！请重新启动应用。
pause
