# Script pour redémarrer le serveur backend immédiatement
Write-Host "🔄 Redémarrage du serveur backend..." -ForegroundColor Cyan
Write-Host ""

# Trouver et arrêter les processus Node.js qui utilisent le port 3000
Write-Host "1. Arrêt des processus existants sur le port 3000..." -ForegroundColor Yellow
$connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $pids) {
        try {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process -and $process.ProcessName -eq "node") {
                Write-Host "   Arrêt du processus Node.js (PID: $pid)..." -ForegroundColor Yellow
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Start-Sleep -Milliseconds 500
            }
        } catch {
            # Ignore errors
        }
    }
    Write-Host "   ✓ Processus arrêtés" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ℹ Aucun processus trouvé sur le port 3000" -ForegroundColor Gray
}

# Attendre un peu pour que le port soit libéré
Start-Sleep -Seconds 1

# Démarrer le serveur backend
Write-Host ""
Write-Host "2. Démarrage du serveur backend..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
if (Test-Path $backendPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🚀 Backend Server - Redémarré' -ForegroundColor Green; npm run dev"
    Write-Host "   ✓ Serveur backend démarré dans une nouvelle fenêtre" -ForegroundColor Green
} else {
    Write-Host "   ❌ Dossier backend introuvable!" -ForegroundColor Red
    exit 1
}

# Attendre que le serveur démarre
Write-Host ""
Write-Host "3. Attente du démarrage du serveur (5 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Tester la route signup
Write-Host ""
Write-Host "4. Test de la route signup..." -ForegroundColor Yellow
try {
    $body = @{username="testuser$(Get-Random)";password="test123456"} | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/signup" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ Route signup fonctionne!" -ForegroundColor Green
    Write-Host "   Réponse: $($response.Content)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 409) {
        Write-Host "   ✅ Route signup fonctionne! (L'utilisateur existe déjà, c'est normal)" -ForegroundColor Green
    } elseif ($statusCode -eq 404) {
        Write-Host "   ⚠️ Route signup retourne toujours 404" -ForegroundColor Yellow
        Write-Host "   Le serveur est peut-être encore en train de démarrer..." -ForegroundColor Yellow
        Write-Host "   Attendez 5 secondes supplémentaires et rafraîchissez la page d'inscription" -ForegroundColor Yellow
    } else {
        Write-Host "   ⚠️ Status Code: $statusCode" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Redémarrage terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Vérifiez la nouvelle fenêtre PowerShell pour voir les logs du serveur" -ForegroundColor White
Write-Host "   2. Rafraîchissez la page d'inscription dans votre navigateur (F5)" -ForegroundColor White
Write-Host "   3. Essayez de créer un compte à nouveau" -ForegroundColor White
Write-Host ""

