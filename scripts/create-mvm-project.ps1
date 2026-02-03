# Create .mvm-project File
# Usage: .\scripts\create-mvm-project.ps1 -ProjectId "abc123-def456-..."

param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId
)

Write-Host "Creating .mvm-project file..." -ForegroundColor Cyan

# Validate UUID format
$uuidPattern = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
if ($ProjectId -notmatch $uuidPattern) {
    Write-Host "Invalid UUID format. Expected: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" -ForegroundColor Red
    exit 1
}

# Create JSON content
$content = "{`"projectId`":`"$ProjectId`"}"

# Write with UTF-8 without BOM (prevents JSON parse errors)
[System.IO.File]::WriteAllText(".mvm-project", $content, [System.Text.UTF8Encoding]::new($false))

Write-Host ""
Write-Host "Created .mvm-project file:" -ForegroundColor Green
Write-Host $content -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open this folder in your AI agent (Antigravity/Cursor/Claude)" -ForegroundColor White
Write-Host "2. Ask: Read .mvm-project and list all pending tasks" -ForegroundColor White
Write-Host ""
