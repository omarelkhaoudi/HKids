@echo off
echo ========================================
echo   REDEMARRAGE DU SERVEUR BACKEND
echo ========================================
echo.

echo [1/3] Arret des processus Node.js...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Demarrage du serveur backend...
cd backend
start "HKids Backend" cmd /k "npm run dev"

echo [3/3] Attente du demarrage (5 secondes)...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   SERVEUR REDEMARRE!
echo ========================================
echo.
echo Verifiez la nouvelle fenetre pour voir:
echo   - "HKids Backend running on http://localhost:3000"
echo   - "Available auth routes: POST /api/auth/signup"
echo.
echo Ensuite, rafraichissez la page d'inscription (F5)
echo.
pause

