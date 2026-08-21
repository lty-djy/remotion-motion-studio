$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$archivePath = Join-Path $projectRoot "MotionComponentStudio-open-source-v1.zip"

$items = @(
  "README.md",
  "LICENSE",
  ".gitignore",
  "index.html",
  "package.json",
  "local-main-v2.tsx",
  "local-builtins.tsx",
  "local-protocol.ts",
  "local-render-entry-v2.tsx",
  "local-styles.css",
  "local-vite.config.ts",
  "local-launcher.ps1",
  "local-launcher.cmd",
  "package-open-source.ps1",
  "import-to-studio.ps1",
  "local-imported",
  "remotion-motion-studio.protocol.md",
  "remotion-motion-studio.manifest-template.tsx",
  "remotion-motion-studio.component-catalog.md",
  "remotion-motion-studio.metric-components.md"
) | ForEach-Object { Join-Path $projectRoot $_ }

if (Test-Path -LiteralPath $archivePath) {
  Remove-Item -LiteralPath $archivePath -Force
}

Compress-Archive -LiteralPath $items -DestinationPath $archivePath -CompressionLevel Optimal

$archive = Get-Item -LiteralPath $archivePath
[PSCustomObject]@{
  Archive = $archive.FullName
  SizeMB = [math]::Round($archive.Length / 1MB, 2)
  Note = "未包含 node_modules、视频、项目草稿、导入历史与渲染成片"
}
