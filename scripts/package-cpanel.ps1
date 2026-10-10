# Builds the site locally and zips what a cPanel Node.js app needs.
# node_modules is left out on purpose: cPanel installs it itself ("Run NPM
# Install") so native packages like sharp get Linux binaries, not Windows ones.
# Usage (repo root):  powershell -File scripts/package-cpanel.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

npm run build
if ($LASTEXITCODE -ne 0) { throw "next build failed" }

$out = "greenpages-cpanel.zip"
$stage = Join-Path $env:TEMP "greenpages-cpanel"
if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
New-Item -ItemType Directory $stage | Out-Null

foreach ($item in "public", "package.json", "package-lock.json", "next.config.js", "server.js") {
  Copy-Item -Recurse $item $stage
}
# .next/cache is only a build cache and can be hundreds of MB.
robocopy .next (Join-Path $stage ".next") /E /XD cache /NFL /NDL /NJH /NJS | Out-Null
if ($LASTEXITCODE -ge 8) { throw "copying .next failed" }

if (Test-Path $out) { Remove-Item -Force $out }
# tar instead of Compress-Archive: PowerShell 5.1 writes backslash paths
# into the zip, which Linux unzips as literal file names.
tar.exe -a -cf $out -C $stage .
if ($LASTEXITCODE -ne 0) { throw "zip failed" }
Remove-Item -Recurse -Force $stage
Write-Host "Created $out"
