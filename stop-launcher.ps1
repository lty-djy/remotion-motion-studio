$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Port = 41735

try {
  $Listener = Get-NetTCPConnection -LocalAddress "127.0.0.1" -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if (-not $Listener) {
    Write-Host "Motion Studio is not running on port $Port."
    exit 0
  }

  $ProcessInfo = Get-CimInstance Win32_Process -Filter "ProcessId=$($Listener.OwningProcess)"
  $CommandLine = [string]$ProcessInfo.CommandLine
  $ExpectedProjectPath = [regex]::Escape($ProjectRoot)
  $IsMotionStudio =
    $ProcessInfo.Name -ieq "node.exe" -and
    $CommandLine -match "(?i)local-vite\.config\.ts" -and
    $CommandLine -match "(?i)$ExpectedProjectPath"

  if (-not $IsMotionStudio) {
    Write-Host "Port $Port is occupied by a different process. It was not stopped."
    exit 2
  }

  Stop-Process -Id $Listener.OwningProcess -Force
  Write-Host "Motion Studio stopped."
  exit 0
} catch {
  Write-Host "Unable to stop Motion Studio: $($_.Exception.Message)"
  exit 1
}
