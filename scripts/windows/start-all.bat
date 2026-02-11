@echo off
echo 🚀 Démarrage de HKids...
echo.

REM Vérifier si Node.js est installé
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js n'est pas installé!
    echo    Installez Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Vérifier les dépendances
if not exist "backend\node_modules" (
    echo 📦 Installation des dépendances backend...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo 📦 Installation des dépendances frontend...
    cd frontend
    call npm install
    cd ..
)

REM Créer .env si nécessaire
if not exist "backend\.env" (
    echo 📝 Création du fichier .env...
    copy "backend\env.example" "backend\.env" >nul
)

echo.
echo 🔧 Démarrage du serveur backend...
start "HKids Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo 🎨 Démarrage du serveur frontend...
start "HKids Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Les serveurs sont en cours de démarrage!
echo.
echo 📍 URLs:
echo    Backend:  http://localhost:3000
echo    Frontend: http://localhost:5173
echo.
echo 🔐 Identifiants admin:
echo    Username: admin
echo    Password: admin123
echo.
pause

