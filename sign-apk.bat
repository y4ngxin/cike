@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo =======================================================
echo          「此刻」(CiKe) Android 16 自动化签名工具
echo =======================================================
echo.

set SCRIPT_DIR=%~dp0
set KEYSTORE=%SCRIPT_DIR%cike.keystore
set SIGNER=%SCRIPT_DIR%uber-apk-signer.jar
set ALIAS=cike
set PASSWORD=cike123456

:: 1. 查找 Java 路径
set JAVA_EXE=
if exist "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot\bin\java.exe" (
    set "JAVA_EXE=C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot\bin\java.exe"
) else (
    where java >nul 2>nul
    if %errorlevel% equ 0 (
        set JAVA_EXE=java
    )
)

if "%JAVA_EXE%"=="" (
    echo [错误] 未找到 Java 运行环境，请确保已安装 JDK 17+。
    pause
    exit /b 1
)

:: 2. 检查工具与密钥文件
if not exist "%SIGNER%" (
    echo [错误] 未在项目根目录找到 uber-apk-signer.jar
    pause
    exit /b 1
)
if not exist "%KEYSTORE%" (
    echo [错误] 未在项目根目录找到 cike.keystore
    pause
    exit /b 1
)

:: 3. 确定要签名的目标 APK
set TARGET_APK=%~1

if "%TARGET_APK%"=="" (
    if exist "%USERPROFILE%\Downloads\cike - Google Play package\cike-unsigned.apk" (
        set "TARGET_APK=%USERPROFILE%\Downloads\cike - Google Play package\cike-unsigned.apk"
    ) else if exist "%SCRIPT_DIR%cike-unsigned.apk" (
        set "TARGET_APK=%SCRIPT_DIR%cike-unsigned.apk"
    ) else (
        echo [提示] 请将要签名的 APK 文件拖动到此 bat 脚本图标上。
        set /p TARGET_APK=请输入或拖入 APK 文件完整路径: 
    )
)

set TARGET_APK=%TARGET_APK:"=%

if not exist "%TARGET_APK%" (
    echo [错误] 找不到指定的 APK 文件: %TARGET_APK%
    pause
    exit /b 1
)

echo [1/3] 目标 APK: %TARGET_APK%
echo [2/3] 正在执行 ZipAlign 与 v1+v2+v3 签名...
echo.

if not exist "%SCRIPT_DIR%release" mkdir "%SCRIPT_DIR%release"

"%JAVA_EXE%" -jar "%SIGNER%" -a "%TARGET_APK%" --ks "%KEYSTORE%" --ksAlias "%ALIAS%" --ksPass "%PASSWORD%" --ksKeyPass "%PASSWORD%" -o "%SCRIPT_DIR%release" --allowResign --verbose

if %errorlevel% equ 0 (
    echo.
    echo =======================================================
    echo  [成功] 签名完成！已完全兼容 Android 14/15/16 及以下系统！
    echo  输出目录: %SCRIPT_DIR%release\
    echo =======================================================
    explorer.exe "%SCRIPT_DIR%release"
) else (
    echo.
    echo [失败] 签名过程中遇到错误。
)

echo.
pause
