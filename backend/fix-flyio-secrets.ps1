# Script PowerShell pour configurer les secrets Fly.io
# Usage: .\fix-flyio-secrets.ps1

Write-Host "🔧 Configuration des secrets Fly.io pour hkids-backend" -ForegroundColor Cyan
Write-Host ""

# Vérifier que flyctl est installé
$flyctlPath = "$env:USERPROFILE\.fly\bin\flyctl.exe"
if (-not (Test-Path $flyctlPath)) {
    Write-Host "❌ flyctl.exe non trouvé à $flyctlPath" -ForegroundColor Red
    Write-Host "💡 Installez Fly CLI: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ flyctl trouvé" -ForegroundColor Green
Write-Host ""

# Demander l'URL du frontend
$corsOrigin = Read-Host "Entrez l'URL de votre frontend (ex: https://votre-app.vercel.app)"

if ([string]::IsNullOrWhiteSpace($corsOrigin)) {
    Write-Host "⚠️  CORS_ORIGIN non défini, utilisation d'une valeur par défaut" -ForegroundColor Yellow
    $corsOrigin = "http://localhost:5173"
}

# Configuration Supabase
$dbHost = "db.kueenrvthimjutyukdej.supabase.co"
$dbPort = "5432"
$dbUser = "postgres"
$dbPassword = "2003@English@2003"
$dbName = "postgres"

# Encoder le mot de passe pour URL (remplacer @ par %40)
$dbPasswordEncoded = $dbPassword -replace '@', '%40'

# Construire DATABASE_URL
$databaseUrl = "postgresql://${dbUser}:${dbPasswordEncoded}@${dbHost}:${dbPort}/${dbName}"

Write-Host ""
Write-Host "📋 Configuration à appliquer:" -ForegroundColor Cyan
Write-Host "   DATABASE_URL: postgresql://${dbUser}:****@${dbHost}:${dbPort}/${dbName}"
Write-Host "   CORS_ORIGIN: $corsOrigin"
Write-Host ""

$confirm = Read-Host "Continuer? (O/N)"
if ($confirm -ne "O" -and $confirm -ne "o" -and $confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "❌ Annulé" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔐 Configuration des secrets..." -ForegroundColor Cyan

# 1. DATABASE_URL
Write-Host "   1/4 Configuration de DATABASE_URL..." -ForegroundColor Yellow
& $flyctlPath secrets set DATABASE_URL="$databaseUrl" --app hkids-backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la configuration de DATABASE_URL" -ForegroundColor Red
    exit 1
}

# 2. JWT_SECRET (générer un secret aléatoire)
Write-Host "   2/4 Configuration de JWT_SECRET..." -ForegroundColor Yellow
$jwtSecret = "hkids-jwt-secret-" + [System.Guid]::NewGuid().ToString()
& $flyctlPath secrets set JWT_SECRET="$jwtSecret" --app hkids-backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la configuration de JWT_SECRET" -ForegroundColor Red
    exit 1
}

# 3. CORS_ORIGIN
Write-Host "   3/4 Configuration de CORS_ORIGIN..." -ForegroundColor Yellow
& $flyctlPath secrets set CORS_ORIGIN="$corsOrigin" --app hkids-backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la configuration de CORS_ORIGIN" -ForegroundColor Red
    exit 1
}

# 4. NODE_ENV
Write-Host "   4/4 Configuration de NODE_ENV..." -ForegroundColor Yellow
& $flyctlPath secrets set NODE_ENV="production" --app hkids-backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la configuration de NODE_ENV" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Tous les secrets ont été configurés!" -ForegroundColor Green
Write-Host ""

# Afficher les secrets configurés
Write-Host "📋 Secrets configurés:" -ForegroundColor Cyan
& $flyctlPath secrets list --app hkids-backend

Write-Host ""
Write-Host "🔄 Redémarrage de l'application..." -ForegroundColor Cyan
& $flyctlPath apps restart hkids-backend

Write-Host ""
Write-Host "⏳ Attente de 5 secondes avant d'afficher les logs..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "📊 Logs de l'application:" -ForegroundColor Cyan
Write-Host ""
& $flyctlPath logs --app hkids-backend

Write-Host ""
Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Testez votre API:" -ForegroundColor Cyan
Write-Host "   https://hkids-backend.fly.dev/api/health" -ForegroundColor White
Write-Host ""

