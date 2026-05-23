# Issue an invite link (loads .env.local automatically)
#
# One-time setup:
#   Copy-Item .env.example .env.local
#   Edit .env.local — set SITE_BASE_URL and ACCESS_TOKEN_SECRET (same as Vercel)
#
# Daily use:
#   .\scripts\invite.ps1 -Label "Google recruiter"
#   .\scripts\invite.ps1 -Label "Phone screen" -Days 3
#
# One-line paste (no .env.local):
#   .\scripts\invite.ps1 -Paste "https://your-app.vercel.app|YOUR_SECRET" -Label "Google"

param(
  [string]$Label = "share",
  [int]$Days = 7,
  [string]$Paste = ""
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$issueScript = Join-Path $scriptDir "issue-invite.mjs"

Push-Location $repoRoot
try {
  $args = @("scripts/issue-invite.mjs", "--days", $Days, "--label", $Label)
  if ($Paste) {
    $args += @("--paste", $Paste)
  }
  & node @args
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
