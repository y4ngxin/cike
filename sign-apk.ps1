<#
.SYNOPSIS
    「此刻」(CiKe) Android 16 一键签名与 4-byte 对齐工具
.DESCRIPTION
    支持拖拽或传入 APK 文件路径，自动应用 ZipAlign + v1/v2/v3 签名
#>

param(
    [string]$ApkPath
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$keystore = Join-Path $scriptDir "cike.keystore"
$signer = Join-Path $scriptDir "uber-apk-signer.jar"
$alias = "cike"
$password = "cike123456"

# 查找 Java 路径
$javaExe = $null
if (Test-Path "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot\bin\java.exe") {
    $javaExe = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot\bin\java.exe"
} else {
    $found = Get-Command "java" -ErrorAction SilentlyContinue
    if ($found) { $javaExe = $found.Source }
}

if (-not $javaExe) {
    Write-Error "[错误] 未找到 Java 环境，请确保已安装 JDK 17+。"
    return
}

# 确定目标 APK
if (-not $ApkPath) {
    $defaultDownloads = Join-Path $env:USERPROFILE "Downloads\cike - Google Play package\cike-unsigned.apk"
    if (Test-Path $defaultDownloads) {
        $ApkPath = $defaultDownloads
    } else {
        $prompt = Read-Host "请输入待签名的 APK 文件路径"
        $ApkPath = $prompt.Trim('"')
    }
}

if (-not (Test-Path $ApkPath)) {
    Write-Error "[错误] 找不到指定的 APK 文件: $ApkPath"
    return
}

$outDir = Join-Path $scriptDir "release"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "       正在为 APK 注入 Android 16 兼容签名与 ZipAlign..." -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "输入文件: $ApkPath"
Write-Host "输出目录: $outDir"

& $javaExe -jar $signer `
    -a $ApkPath `
    --ks $keystore `
    --ksAlias $alias `
    --ksPass $password `
    --ksKeyPass $password `
    -o $outDir `
    --allowResign `
    --verbose

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[成功] 签名与对齐已完成！兼容 Android 14/15/16！" -ForegroundColor Green
    Start-Process "explorer.exe" $outDir
} else {
    Write-Error "[失败] 签名出错，请查看日志。"
}
