@echo off
echo === Demarrage de l'application avec Docker ===

echo.
echo 1. Construction et demarrage des conteneurs...
docker-compose up --build -d

echo.
echo 2. Attente du demarrage des services...
timeout /t 30 >nul

echo.
echo 3. Initialisation de la base de donnees...
docker exec cleaning-app-backend npx prisma db push
docker exec cleaning-app-backend npm run prisma:seed

echo.
echo === Application demarree avec Docker ! ===
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo Base de donnees: localhost:5432
echo.
echo Comptes de demonstration:
echo Admin: admin@cleaning.com / admin123
echo Agent: marie.dupont@cleaning.com / agent123
echo.
echo Pour arreter: docker-compose down

pause