@echo off
echo === Demarrage de l'application en mode developpement ===

echo.
echo 1. Demarrage de PostgreSQL avec Docker...
docker run --name cleaning-app-postgres -e POSTGRES_DB=cleaning_app -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

timeout /t 5 >nul

echo.
echo 2. Demarrage du backend...
start cmd /k "cd backend && npm install && npx prisma db push && npm run prisma:seed && npm run dev"

timeout /t 10 >nul

echo.
echo 3. Demarrage du frontend...
start cmd /k "cd frontend && npm install && npm run dev"

echo.
echo === Application demarree ! ===
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo.
echo Comptes de demonstration:
echo Admin: admin@cleaning.com / admin123
echo Agent: marie.dupont@cleaning.com / agent123

pause