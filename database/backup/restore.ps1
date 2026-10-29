<#
.SYNOPSIS
    Phục hồi CSDL HRM từ một bản sao lưu (.zip hoặc .sql) do backup.ps1 tạo ra.

.DESCRIPTION
    - GHI ĐÈ toàn bộ dữ liệu hiện tại của CSDL trungnguyen_hrm_lite.
    - Trước khi phục hồi, tự động tạo một bản sao lưu an toàn của dữ liệu hiện tại
      (bỏ qua bằng -SkipSafetyBackup).
    - Yêu cầu gõ xác nhận "PHUC HOI" (bỏ qua bằng -Force khi chạy tự động).

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File database\backup\restore.ps1 -File database\backup\files\hrm_trungnguyen_hrm_lite_20261028_230000.zip
#>
param(
    [Parameter(Mandatory = $true)][string]$File,
    [string]$Container = "trungnguyen_hrm_lite",
    [switch]$Force,
    [switch]$SkipSafetyBackup
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $File)) { throw "Không tìm thấy file sao lưu: $File" }
$running = docker ps --filter "name=^${Container}$" --format "{{.Names}}"
if ($running -ne $Container) {
    throw "Container '$Container' chưa chạy. Hãy chạy 'docker compose up -d db' trước."
}

if (-not $Force) {
    Write-Warning "Thao tác này GHI ĐÈ toàn bộ dữ liệu hiện tại bằng bản sao lưu: $File"
    $answer = Read-Host "Gõ PHUC HOI để tiếp tục"
    if ($answer -ne "PHUC HOI") { Write-Host "Đã hủy."; exit 1 }
}

if (-not $SkipSafetyBackup) {
    Write-Host "[0/3] Sao lưu an toàn dữ liệu hiện tại trước khi phục hồi..."
    & (Join-Path $PSScriptRoot "backup.ps1") -Container $Container -KeepDays 3650
}

$workDir = Join-Path ([System.IO.Path]::GetTempPath()) ("hrm_restore_" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $workDir | Out-Null
try {
    if ($File.ToLower().EndsWith(".zip")) {
        Expand-Archive -Path $File -DestinationPath $workDir -Force
        $sqlFile = Get-ChildItem $workDir -Filter "*.sql" | Select-Object -First 1
        if (-not $sqlFile) { throw "File .zip không chứa bản dump .sql" }
        $sqlPath = $sqlFile.FullName
    } else {
        $sqlPath = (Resolve-Path $File).Path
    }

    Write-Host "[1/3] Đưa bản dump vào container..."
    docker cp $sqlPath "${Container}:/tmp/hrm_restore.sql"
    if ($LASTEXITCODE -ne 0) { throw "docker cp thất bại (mã lỗi $LASTEXITCODE)." }

    Write-Host "[2/3] Đang phục hồi CSDL..."
    docker exec $Container sh -c 'mariadb -uroot -p$MYSQL_ROOT_PASSWORD --default-character-set=utf8mb4 < /tmp/hrm_restore.sql'
    $code = $LASTEXITCODE
    docker exec $Container rm -f /tmp/hrm_restore.sql | Out-Null
    if ($code -ne 0) { throw "Phục hồi thất bại (mã lỗi $code). Dữ liệu cũ vẫn còn trong bản sao lưu an toàn." }

    Write-Host "[3/3] Kiểm tra nhanh số lượng bản ghi sau phục hồi:"
    # Câu truy vấn đi qua stdin: PowerShell 5.1 làm hỏng dấu nháy kép lồng trong tham số gửi cho docker
    $check = "SELECT 'nhan_vien', COUNT(*) FROM nhan_vien UNION ALL SELECT 'bang_cham_cong', COUNT(*) FROM bang_cham_cong UNION ALL SELECT 'bang_luong', COUNT(*) FROM bang_luong;"
    $check | docker exec -i $Container sh -c 'mariadb -uroot -p$MYSQL_ROOT_PASSWORD -N trungnguyen_hrm_lite'
    Write-Host "Phục hồi hoàn tất."
}
finally {
    Remove-Item -Recurse -Force $workDir -ErrorAction SilentlyContinue
}
