$wallBase64 = Get-Content -Path 'wall_base64.txt' -Raw
$wallDataUri = 'data:image/png;base64,' + $wallBase64

$swordBase64 = Get-Content -Path 'sword_base64.txt' -Raw
$swordDataUri = 'data:image/png;base64,' + $swordBase64

$cssContent = Get-Content -Path 'style.css' -Raw

# 使用简单的字符串替换而不是正则表达式
$cssContent = $cssContent.Replace("url('https://yixiaostudio.github.io/maze-game/images/wall.png')", "url('$wallDataUri')")
$cssContent = $cssContent.Replace("url('https://yixiaostudio.github.io/maze-game/images/sword.png')", "url('$swordDataUri')")

Set-Content -Path 'style.css' -Value $cssContent -Encoding UTF8
Write-Host "Images replaced successfully!"
