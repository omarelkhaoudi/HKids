# Script pour redémarrer le serveur backend
Write-Host "🔄 Redémarrage du serveur backend..." -ForegroundColor Cyan

# Trouver et arrêter les processus Node.js qui tournent sur le port 3000
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    Write-Host "Arrêt des processus existants..." -ForegroundColor Yellow
    foreach ($pid in $processes) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Processus $pid arrêté" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Impossible d'arrêter le processus $pid" -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds 2
}

# Démarrer le serveur backend
Write-Host "Démarrage du serveur backend..." -ForegroundColor Yellow
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🚀 Backend Server' -ForegroundColor Green; npm run dev"
Set-Location ..

Write-Host "✅ Serveur backend redémarré!" -ForegroundColor Green
Write-Host "Attendez quelques secondes que le serveur démarre..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Tester la route signup
Write-Host "Test de la route signup..." -ForegroundColor Cyan
try {
    $body = @{username="testuser";password="test123"} | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/signup" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Route signup fonctionne!" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Host "✅ Route signup fonctionne! (L'utilisateur existe déjà, c'est normal)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Route signup retourne: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
        Write-Host "   Le serveur est peut-être encore en train de démarrer..." -ForegroundColor Yellow
    }
}

