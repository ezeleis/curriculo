# Exports print-styled resume to PDF using Microsoft Edge (Chromium).
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$htmlPath = Join-Path $root "index.html"
$outPdf = Join-Path $root "Facundo_Leis_Pou_Resume_FullStack.pdf"
$tmpPdf = Join-Path ([System.IO.Path]::GetTempPath()) ("resume-export-" + [Guid]::NewGuid().ToString() + ".pdf")

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
  "--print-to-pdf=$tmpPdf",
  $fileUri
) -PassThru -NoNewWindow
$p.WaitForExit(120000) | Out-Null
Start-Sleep -Milliseconds 800
if (-not (Test-Path $tmpPdf)) {
  Write-Error "PDF was not created. Try Print to PDF from the browser."
}
try {
  Copy-Item -Path $tmpPdf -Destination $outPdf -Force -ErrorAction Stop
  Write-Host "Wrote $outPdf"
} catch {
  $alt = Join-Path $root "Facundo_Leis_Pou_Resume_export.pdf"
  Copy-Item -Path $tmpPdf -Destination $alt -Force -ErrorAction Stop
  Write-Warning "Could not overwrite $outPdf (file may be open). Wrote $alt instead. Close the PDF viewer and run again, or rename the export file."
}
Remove-Item -Path $tmpPdf -Force -ErrorAction SilentlyContinue
