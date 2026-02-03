# Generate MVM API Secret Key
# Usage: .\scripts\generate-api-key.ps1

Write-Host "Generating MVM API Secret Key..." -ForegroundColor Cyan

$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$key = "mvm_sk_live_" + [Convert]::ToBase64String($bytes).Replace("+", "A").Replace("/", "B").Substring(0, 32)

Write-Host ""
Write-Host "✅ Generated API Key:" -ForegroundColor Green
Write-Host $key -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Add this to your .env.local file:" -ForegroundColor Cyan
Write-Host "API_SECRET_KEY=$key" -ForegroundColor White
Write-Host ""
