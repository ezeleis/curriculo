# Exports print-styled resume to PDF using Microsoft Edge (Chromium).
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$htmlPath = Join-Path $root "index.html"
$outPdf = Join-Path $root "Facundo_Leis_Pou_Resume_FullStack.pdf"

if (-not (Test-Path $htmlPath)) {
  Write-Error "index.html not found at $htmlPath"
}

$edgeCandidates = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$edge = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $edge) {
  Write-Error "Microsoft Edge not found. Open index.html in a browser and use Print -> Save as PDF."
}

$fileUri = ([Uri]$htmlPath).AbsoluteUri
$p = Start-Process -FilePath $edge -ArgumentList @(
  "--headless=new",
  "--disable-gpu",
  "--no-pdf-header-footer",
  "--print-to-pdf=$outPdf",
  $fileUri
) -PassThru -NoNewWindow
$p.WaitForExit(120000) | Out-Null
Start-Sleep -Milliseconds 500
if (Test-Path $outPdf) {
  Write-Host "Wrote $outPdf"
} else {
  Write-Error "PDF was not created. Try Print to PDF from the browser."
}
