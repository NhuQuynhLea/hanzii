$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
Get-Content "$root\.env" | ForEach-Object {
  if ($_ -match '^\s*([^#=]+?)\s*=\s*(.*)\s*$') {
    [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
  }
}
if (-not $env:CLOUDFLARE_API_TOKEN) { throw 'CLOUDFLARE_API_TOKEN is empty in .env' }

Push-Location $root
try { npm run build }
finally { Pop-Location }

Push-Location (Join-Path $root 'dist')
try { npx --yes wrangler@4 pages deploy . --project-name nowhanzi }
finally { Pop-Location }
