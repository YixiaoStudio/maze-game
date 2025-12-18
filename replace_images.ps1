$wallBase64 = Get-Content -Path 'wall_base64.txt' -Raw
$wallDataUri = 'data:image/png;base64,' + $wallBase64

$swordBase64 = Get-Content -Path 'sword_base64.txt' -Raw
$swordDataUri = 'data:image/png;base64,' + $swordBase64

$cssContent = Get-Content -Path 'style.css' -Raw
$cssContent = $cssContent -replace "url('https://yixiaostudio.github.io/maze-game/images/wall.png')", "url('$wallDataUri')"
$cssContent = $cssContent -replace "url('https://yixiaostudio.github.io/maze-game/images/sword.png')", "url('$swordDataUri')"

Set-Content -Path 'style.css' -Value $cssContent -Encoding UTF8
Write-Host "Images replaced successfully!"
