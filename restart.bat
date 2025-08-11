@echo off
echo 🛑 Arrêt de tous les processus Node...
taskkill /F /IM node.exe 2>NUL

echo ⏳ Attente de 2 secondes...
timeout /t 2 /nobreak >NUL

echo 🚀 Démarrage du backend (port 4000)...
start "Backend" cmd /k "cd /d C:\Users\os\Desktop\CLAUDE-\cleaning-app\backend && npm run dev"

echo ⏳ Attente de 3 secondes...
timeout /t 3 /nobreak >NUL

echo 🌐 Démarrage du frontend (port 3000)...
start "Frontend" cmd /k "cd /d C:\Users\os\Desktop\CLAUDE-\cleaning-app\frontend && npm run dev"

echo ✅ Applications démarrées !
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:4000
pause