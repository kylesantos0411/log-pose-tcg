Start-Sleep 3

$r1 = (Invoke-WebRequest 'http://localhost:3000/api/cards?q=flagship&limit=5' -UseBasicParsing).Content | ConvertFrom-Json
$r2 = (Invoke-WebRequest 'http://localhost:3000/api/cards?q=anniversary&limit=5' -UseBasicParsing).Content | ConvertFrom-Json
$r3 = (Invoke-WebRequest 'http://localhost:3000/api/cards?rarity=Promo&limit=5' -UseBasicParsing).Content | ConvertFrom-Json
$r4 = (Invoke-WebRequest 'http://localhost:3000/api/cards?q=tournament&limit=5' -UseBasicParsing).Content | ConvertFrom-Json

Write-Output "Flagship search count: $($r1.pagination.total)"
Write-Output "Anniversary search count: $($r2.pagination.total)"
Write-Output "Promo rarity filter count: $($r3.pagination.total)"
Write-Output "Tournament search count: $($r4.pagination.total)"

Write-Output "`nSample flagship cards:"
$r1.cards | ForEach-Object { Write-Output "  $($_.id) | $($_.name) | $($_.promoSource)" }

Write-Output "`nSample anniversary cards:"
$r2.cards | ForEach-Object { Write-Output "  $($_.id) | $($_.name) | $($_.promoSource)" }

Write-Output "`nTotal sets in DB:"
$sets = (Invoke-WebRequest 'http://localhost:3000/api/sets' -UseBasicParsing).Content | ConvertFrom-Json
Write-Output "  $($sets.sets.Count) sets"
$promoPacks = $sets.sets | Where-Object { $_.seriesType -match 'PROMO|SPECIAL|EVENT|PREMIUM' }
$promoPacks | ForEach-Object { Write-Output "  $($_.code) | $($_.name) | $($_.seriesType)" }
