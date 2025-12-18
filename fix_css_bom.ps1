$cssPath = "style.css"
$content = Get-Content -Path $cssPath -Raw
$content = $content -replace "^\p{Z}*\*\s*\{", "* {"
Set-Content -Path $cssPath -Value $content -Encoding UTF8
Write-Host "Fixed BOM issue in CSS file!"