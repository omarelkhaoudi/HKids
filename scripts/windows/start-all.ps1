# Script de démarrage automatique pour HKids
# Démarre le backend et le frontend dans des fenêtres séparées

Write-Host "🚀 Démarrage de HKids..." -ForegroundColor Green
Write-Host ""

# Vérifier si Node.js est installé
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé!" -ForegroundColor Red
    Write-Host "   Installez Node.js depuis https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Vérifier si les dépendances sont installées
if (!(Test-Path "backend/node_modules")) {
    Write-Host "📦 Installation des dépendances backend..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

if (!(Test-Path "frontend/node_modules")) {
    Write-Host "📦 Installation des dépendances frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# Créer le fichier .env s'il n'existe pas
if (!(Test-Path "backend/.env")) {
    Write-Host "📝 Création du fichier .env..." -ForegroundColor Yellow
    Copy-Item "backend/env.example" "backend/.env"
}

Write-Host ""
Write-Host "🔧 Démarrage du serveur backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '🚀 Backend Server' -ForegroundColor Green; npm run dev"

# Attendre un peu pour que le backend démarre
Start-Sleep -Seconds 3

Write-Host "🎨 Démarrage du serveur frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host '🎨 Frontend Server' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "✅ Les serveurs sont en cours de démarrage!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 URLs:" -ForegroundColor Yellow
Write-Host "   Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Identifiants admin:" -ForegroundColor Yellow
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "💡 Appuyez sur Ctrl+C dans chaque fenêtre pour arrêter les serveurs" -ForegroundColor Gray

