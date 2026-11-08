# Use from the unzipped project directory after creating an EMPTY
# repository under the mentAImage organization on GitHub.
# Requires Git for Windows and authorization to push to the repository.
param(
  [Parameter(Mandatory = $true)]
  [string]$RepositoryUrl
)
$ErrorActionPreference = 'Stop'
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git is not installed. Install Git for Windows first.' }
if (-not (Test-Path 'package.json')) { throw 'Run this script from the project folder containing package.json.' }
if (-not (Test-Path '.git')) { git init }
git branch -M main
git add .
$changes = git status --porcelain
if ($changes) { git commit -m 'Import Figma Make PulseKey/NDMAPS demo with practitioner inventory and patient view toggle' }
$exists = git remote 2>$null | Select-String -SimpleMatch 'origin'
if ($exists) { git remote set-url origin $RepositoryUrl }
else { git remote add origin $RepositoryUrl }
git push -u origin main
Write-Host "Pushed the interactive demo source to $RepositoryUrl" -ForegroundColor Green
