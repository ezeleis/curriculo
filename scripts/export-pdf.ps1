# Exports print-styled resume to PDF using Microsoft Edge (Chromium).
param(
  [ValidateSet("developer", "sdr", "corretor")]
  [string]$Profile = "developer",
  [ValidateSet("en", "pt-BR", "es")]
  [string]$Lang = "en",
  [switch]$All
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$htmlPath = Join-Path $root "index.html"
$exportsDir = Join-Path $root "exports"
$servePort = 8765

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

New-Item -ItemType Directory -Force -Path $exportsDir | Out-Null

function Start-LocalServer {
  param([string]$RootPath, [int]$Port)
  $python = Get-Command python -ErrorAction SilentlyContinue
  if (-not $python) {
    Write-Error "Python is required for PDF export (loads JSON over HTTP). Install Python or use Print / Save as PDF in the browser."
  }
  $proc = Start-Process -FilePath $python.Source -ArgumentList @(
    "-m", "http.server", [string]$Port, "--directory", $RootPath
  ) -PassThru -WindowStyle Hidden
  Start-Sleep -Milliseconds 600
  return $proc
}

function Stop-LocalServer {
  param($Process)
  if ($Process -and -not $Process.HasExited) {
    Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
  }
}

function Export-ResumePdf {
  param(
    [string]$ProfileName,
    [string]$LangCode,
    [string]$BaseUrl
  )

  $basename = "Facundo_Leis_Pou_Resume_${ProfileName}_${LangCode}"
  $outPdf = Join-Path $exportsDir ($basename + ".pdf")
  $tmpPdf = Join-Path ([System.IO.Path]::GetTempPath()) ("resume-export-" + [Guid]::NewGuid().ToString() + ".pdf")
  $query = "?profile=" + [Uri]::EscapeDataString($ProfileName) + "&lang=" + [Uri]::EscapeDataString($LangCode)
  $pageUri = $BaseUrl + "/index.html" + $query

  $p = Start-Process -FilePath $edge -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--virtual-time-budget=5000",
    "--print-to-pdf=$tmpPdf",
    $pageUri
  ) -PassThru -NoNewWindow
  $p.WaitForExit(120000) | Out-Null
  Start-Sleep -Milliseconds 800

  if (-not (Test-Path $tmpPdf)) {
    Write-Error "PDF was not created for profile=$ProfileName lang=$LangCode. Try Print to PDF from the browser."
  }

  Copy-Item -Path $tmpPdf -Destination $outPdf -Force
  Remove-Item -Path $tmpPdf -Force -ErrorAction SilentlyContinue
  Write-Host "Wrote $outPdf"
}

$server = Start-LocalServer -RootPath $root -Port $servePort
$baseUrl = "http://127.0.0.1:$servePort"

try {
  if ($All) {
    foreach ($profileName in @("developer", "sdr", "corretor")) {
      foreach ($langCode in @("en", "pt-BR", "es")) {
        Export-ResumePdf -ProfileName $profileName -LangCode $langCode -BaseUrl $baseUrl
      }
    }
  } else {
    Export-ResumePdf -ProfileName $Profile -LangCode $Lang -BaseUrl $baseUrl
  }
} finally {
  Stop-LocalServer -Process $server
}
