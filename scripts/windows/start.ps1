# Script de démarrage principal pour HKids
# Démarre le backend et le frontend dans des fenêtres séparées

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   DEMARRAGE DE HKIDS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier PostgreSQL
Write-Host "1. Vérification de PostgreSQL..." -ForegroundColor Yellow
$pgRunning = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
if ($pgRunning) {
    Write-Host "   ✅ PostgreSQL est en cours d'exécution" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  PostgreSQL n'est pas démarré" -ForegroundColor Red
    Write-Host "   💡 Démarrez PostgreSQL ou utilisez Docker" -ForegroundColor Yellow
    exit 1
}

# Vérifier le fichier .env
Write-Host "`n2. Vérification de la configuration..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "..\..\backend"
if (Test-Path (Join-Path $backendPath ".env")) {
    Write-Host "   ✅ Fichier .env trouvé" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Fichier .env manquant, création..." -ForegroundColor Yellow
    Copy-Item (Join-Path $backendPath "env.example") (Join-Path $backendPath ".env")
    Write-Host "   ✅ Fichier .env créé" -ForegroundColor Green
}

# Démarrer le backend
Write-Host "`n3. Démarrage du backend..." -ForegroundColor Yellow
Write-Host "   📂 Dossier: backend" -ForegroundColor Gray
Write-Host "   🌐 URL: http://localhost:3000" -ForegroundColor Gray
$projectRoot = Join-Path $PSScriptRoot "..\.."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; Write-Host '🚀 Backend HKids' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 3

# Démarrer le frontend
Write-Host "`n4. Démarrage du frontend..." -ForegroundColor Yellow
Write-Host "   📂 Dossier: frontend" -ForegroundColor Gray
Write-Host "   🌐 URL: http://localhost:5173" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; Write-Host '🚀 Frontend HKids' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 2

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   ✅ DÉMARRAGE TERMINÉ!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "`n💡 Les deux fenêtres PowerShell sont ouvertes." -ForegroundColor Yellow
Write-Host "   Vous pouvez voir les logs dans chaque fenêtre.`n" -ForegroundColor Yellow

