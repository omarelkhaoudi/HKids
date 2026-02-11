# Script PowerShell pour forcer le redémarrage du serveur backend
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FORCE REDEMARRAGE SERVEUR BACKEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Arrêter tous les processus Node.js
Write-Host "[1/4] Arret de tous les processus Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        try {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Processus $($proc.Id) arrete" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Impossible d'arreter le processus $($proc.Id)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ℹ Aucun processus Node.js trouve" -ForegroundColor Gray
}

# Attendre que les processus soient bien arrêtés
Start-Sleep -Seconds 3

# Étape 2: Vérifier que le port 3000 est libre
Write-Host ""
Write-Host "[2/4] Verification du port 3000..." -ForegroundColor Yellow
$connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($connections) {
    Write-Host "  ⚠ Port 3000 encore utilise, attente..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
} else {
    Write-Host "  ✓ Port 3000 est libre" -ForegroundColor Green
}

# Étape 3: Démarrer le serveur backend
Write-Host ""
Write-Host "[3/4] Demarrage du serveur backend..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
if (Test-Path $backendPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🚀 Backend Server - Redemarre avec route signup' -ForegroundColor Green; Write-Host ''; npm run dev"
    Write-Host "  ✓ Serveur backend demarre dans une nouvelle fenetre" -ForegroundColor Green
} else {
    Write-Host "  ❌ Dossier backend introuvable!" -ForegroundColor Red
    exit 1
}

# Étape 4: Attendre et tester
Write-Host ""
Write-Host "[4/4] Attente du demarrage et test (10 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Test de la route signup..." -ForegroundColor Cyan
$testUser = "testuser$(Get-Random -Maximum 99999)"
$testBody = @{username=$testUser;password="test123456"} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/signup" -Method POST -ContentType "application/json" -Body $testBody -UseBasicParsing -TimeoutSec 5
    Write-Host ""
    Write-Host "✅✅✅ SUCCES! La route signup fonctionne maintenant!" -ForegroundColor Green
    Write-Host "Vous pouvez maintenant creer un compte sur la page d'inscription!" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 409) {
        Write-Host ""
        Write-Host "✅ Route signup fonctionne! (L'utilisateur existe deja)" -ForegroundColor Green
    } elseif ($statusCode -eq 404) {
        Write-Host ""
        Write-Host "⚠️ La route retourne toujours 404" -ForegroundColor Yellow
        Write-Host "Verifiez la nouvelle fenetre PowerShell pour voir les logs du serveur" -ForegroundColor Yellow
        Write-Host "Cherchez le message: '📋 Available auth routes:'" -ForegroundColor Yellow
        Write-Host "Si vous ne voyez pas ce message, le serveur n'a pas charge la route" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  REDEMARRAGE TERMINE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "1. Verifiez la nouvelle fenetre PowerShell pour voir les logs" -ForegroundColor White
Write-Host "2. Cherchez: '📋 Available auth routes:' avec 'POST /api/auth/signup'" -ForegroundColor White
Write-Host "3. Rafraichissez la page d'inscription dans votre navigateur (F5)" -ForegroundColor White
Write-Host "4. Essayez de creer un compte" -ForegroundColor White
Write-Host ""

