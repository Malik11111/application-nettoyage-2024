@echo off
echo 🚀 Démarrage de l'application de nettoyage multi-tenant
echo.

:choose_ports
echo Choisissez vos ports :
echo 1. Ports par défaut (Frontend: 3000, Backend: 4000)
echo 2. Ports alternatifs (Frontend: 8080, Backend: 8081)
echo 3. Ports personnalisés
echo 4. Utiliser ports automatiques (Vite choisit)
echo.

set /p choice="Votre choix (1-4): "

if "%choice%"=="1" (
    set FRONTEND_PORT=3000
    set BACKEND_PORT=4000
    goto start_apps
)
if "%choice%"=="2" (
    set FRONTEND_PORT=8080
    set BACKEND_PORT=8081
    goto start_apps
)
if "%choice%"=="3" (
    set /p FRONTEND_PORT="Port frontend: "
    set /p BACKEND_PORT="Port backend: "
    goto start_apps
)
if "%choice%"=="4" (
    set FRONTEND_PORT=auto
    set BACKEND_PORT=auto
    goto start_apps
)

echo ❌ Choix invalide
goto choose_ports

:start_apps
echo.
echo 🛑 Arrêt des anciens processus...
taskkill /F /IM node.exe 2>NUL

echo ⏳ Attente...
timeout /t 2 /nobreak >NUL

if "%BACKEND_PORT%"=="auto" (
    echo 🚀 Démarrage backend (port automatique)...
    start "Backend" cmd /k "cd /d C:\Users\os\Desktop\CLAUDE-\cleaning-app\backend && npm run dev"
) else (
    echo 🚀 Démarrage backend (port %BACKEND_PORT%)...
    start "Backend" cmd /k "cd /d C:\Users\os\Desktop\CLAUDE-\cleaning-app\backend && set PORT=%BACKEND_PORT% && npm run dev"
)

timeout /t 3 /nobreak >NUL

if "%FRONTEND_PORT%"=="auto" (
    echo 🌐 Démarrage frontend (port automatique)...
    start "Frontend" cmd /k "cd /d C:\Users\os\Desktop\CLAUDE-\cleaning-app\frontend && npm run dev"
) else (
    echo 🌐 Démarrage frontend (port %FRONTEND_PORT%)...
    start "Frontend" cmd /k "cd /d C:\Users\os\Desktop\CLAUDE-\cleaning-app\frontend && npm run dev -- --port %FRONTEND_PORT%"
)

echo.
echo ✅ Applications démarrées !
if "%FRONTEND_PORT%"=="auto" (
    echo 🌐 Frontend: Vérifiez la console pour l'URL
) else (
    echo 🌐 Frontend: http://localhost:%FRONTEND_PORT%
)
if "%BACKEND_PORT%"=="auto" (
    echo 🔧 Backend: Vérifiez la console pour l'URL
) else (
    echo 🔧 Backend: http://localhost:%BACKEND_PORT%
)
echo.
pause