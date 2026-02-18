# Script de déploiement Fly.io pour HKids Backend

Write-Host "🚀 Déploiement du backend HKids sur Fly.io..." -ForegroundColor Cyan

# Aller dans le dossier backend
Set-Location $PSScriptRoot

# Vérifier que fly est disponible
if (-not (Get-Command fly -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Fly CLI n'est pas trouvé dans le PATH" -ForegroundColor Red
    Write-Host "💡 Essayez d'ajouter C:\Users\omare\.fly\bin au PATH" -ForegroundColor Yellow
    exit 1
}

# Déployer
Write-Host "📦 Déploiement en cours..." -ForegroundColor Yellow
fly deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Déploiement réussi !" -ForegroundColor Green
    Write-Host "🌐 Votre API est disponible à : https://hkids-backend.fly.dev" -ForegroundColor Cyan
} else {
    Write-Host "❌ Erreur lors du déploiement" -ForegroundColor Red
    exit 1
}

