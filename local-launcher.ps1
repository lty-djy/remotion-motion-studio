param(
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BundledNode = Join-Path $ProjectRoot "runtime\node.exe"
$ViteCli = Join-Path $ProjectRoot "node_modules\vite\bin\vite.js"
$Url = "http://127.0.0.1:41735"
$HealthUrl = "$Url/api/health"

function Show-LauncherError {
  param([string]$Message)

  if ($NoOpen) {
    Write-Host $Message
    return
  }

  try {
    $Shell = New-Object -ComObject WScript.Shell
    $Shell.Popup($Message, 0, "Motion Studio Launcher", 16) | Out-Null
  } catch {
    Write-Host $Message
  }
}

function Test-LocalHealth {
  try {
    $Request = [System.Net.HttpWebRequest]::Create($HealthUrl)
    $Request.Proxy = $null
    $Request.Timeout = 1000
    $Request.ReadWriteTimeout = 1000
    $Response = $Request.GetResponse()
    try {
      return [int]$Response.StatusCode -eq 200
    } finally {
      $Response.Close()
    }
  } catch {
    return $false
  }
}

if (-not (Test-Path -LiteralPath $ViteCli)) {
  Show-LauncherError "Project dependencies are missing. Run npm install in the project folder first."
  exit 1
}

if (Test-Path -LiteralPath $BundledNode) {
  $NodeExecutable = $BundledNode
} else {
  try {
    $NodeExecutable = (Get-Command node -ErrorAction Stop).Source
  } catch {
    Show-LauncherError "Node.js was not found. Install Node.js 20 or newer first."
    exit 1
  }
}

if (-not (Test-LocalHealth)) {
  Start-Process `
    -FilePath $NodeExecutable `
    -ArgumentList @("`"$ViteCli`"", "--config", "local-vite.config.ts", "--host", "127.0.0.1", "--port", "41735") `
    -WorkingDirectory $ProjectRoot `
    -WindowStyle Hidden

  $Ready = $false
  for ($Attempt = 0; $Attempt -lt 60; $Attempt++) {
    Start-Sleep -Milliseconds 500
    if (Test-LocalHealth) {
      $Ready = $true
      break
    }
  }

  if (-not $Ready) {
    Show-LauncherError "The local service did not start. Port 41735 may already be in use."
    exit 1
  }
}

if (-not $NoOpen) {
  Start-Process -FilePath $Url
}

exit 0
