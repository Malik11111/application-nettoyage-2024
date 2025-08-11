#!/bin/bash

echo "=== Démarrage de l'application en mode développement ==="
echo

echo "1. Démarrage de PostgreSQL avec Docker..."
docker run --name cleaning-app-postgres \
  -e POSTGRES_DB=cleaning_app \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

sleep 5

echo
echo "2. Configuration et démarrage du backend..."
cd backend
npm install
npx prisma db push
npm run prisma:seed
npm run dev &
BACKEND_PID=$!

echo
echo "3. Attente du démarrage du backend..."
sleep 10

echo
echo "4. Configuration et démarrage du frontend..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo
echo "=== Application démarrée ! ==="
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo
echo "Comptes de démonstration:"
echo "Admin: admin@cleaning.com / admin123"
echo "Agent: marie.dupont@cleaning.com / agent123"
echo
echo "Appuyez sur Ctrl+C pour arrêter l'application"

# Fonction pour nettoyer les processus
cleanup() {
    echo
    echo "Arrêt de l'application..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    docker stop cleaning-app-postgres 2>/dev/null
    docker rm cleaning-app-postgres 2>/dev/null
    exit
}

# Capture Ctrl+C
trap cleanup SIGINT

# Attendre que les processus se terminent
wait