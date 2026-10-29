<#
.SYNOPSIS
    Sao lưu CSDL HRM (MariaDB chạy trong Docker) ra file .zip có dấu thời gian.

.DESCRIPTION
    - Dump toàn bộ CSDL trungnguyen_hrm_lite (bảng, dữ liệu, routine, trigger, event) bằng
      mariadb-dump --single-transaction (không khóa bảng, an toàn khi hệ thống đang chạy).
    - Dump được tạo BÊN TRONG container rồi docker cp ra ngoài để giữ nguyên mã hóa UTF-8
      (PowerShell 5.1 ghi file bằng ">" sẽ đổi sang UTF-16 và làm hỏng bản sao lưu).
    - Nén .zip, xóa các bản sao lưu cũ hơn số ngày giữ lại.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File database\backup\backup.ps1
    powershell -ExecutionPolicy Bypass -File database\backup\backup.ps1 -KeepDays 30
#>
param(
    [string]$Container = "trungnguyen_hrm_lite",
    [string]$Database = "trungnguyen_hrm_lite",
    [string]$OutputDir = (Join-Path $PSScriptRoot "files"),
    [int]$KeepDays = 7
)

$ErrorActionPreference = "Stop"

$running = docker ps --filter "name=^${Container}$" --format "{{.Names}}"
if ($running -ne $Container) {
    throw "Container '$Container' chưa chạy. Hãy chạy 'docker compose up -d db' trước."
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$name = "hrm_${Database}_${stamp}"
$sqlFile = Join-Path $OutputDir "$name.sql"
$zipFile = Join-Path $OutputDir "$name.zip"
$tmpInContainer = "/tmp/$name.sql"

Write-Host "[1/4] Đang dump CSDL '$Database' trong container '$Container'..."
docker exec $Container sh -c "mariadb-dump -uroot -p`$MYSQL_ROOT_PASSWORD --single-transaction --routines --triggers --events --default-character-set=utf8mb4 --databases $Database > $tmpInContainer"
if ($LASTEXITCODE -ne 0) { throw "mariadb-dump thất bại (mã lỗi $LASTEXITCODE)." }

Write-Host "[2/4] Sao chép bản dump ra máy host..."
docker cp "${Container}:$tmpInContainer" $sqlFile
if ($LASTEXITCODE -ne 0) { throw "docker cp thất bại (mã lỗi $LASTEXITCODE)." }
docker exec $Container rm -f $tmpInContainer | Out-Null

if ((Get-Item $sqlFile).Length -lt 1024) {
    throw "File sao lưu quá nhỏ, có thể dump bị lỗi: $sqlFile"
}

Write-Host "[3/4] Nén thành $zipFile ..."
Compress-Archive -Path $sqlFile -DestinationPath $zipFile -Force
Remove-Item $sqlFile

Write-Host "[4/4] Xóa bản sao lưu cũ hơn $KeepDays ngày..."
Get-ChildItem $OutputDir -Filter "hrm_*.zip" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) } |
    ForEach-Object { Write-Host "  - Xóa $($_.Name)"; Remove-Item $_.FullName }

$sizeKb = [math]::Round((Get-Item $zipFile).Length / 1KB, 1)
Write-Host "Hoàn tất: $zipFile ($sizeKb KB)"
