#!/bin/bash

echo "=== Démarrage de l'application avec Docker ==="
echo

echo "1. Construction et démarrage des conteneurs..."
docker-compose up --build -d

echo
echo "2. Attente du démarrage des services..."
sleep 30

echo
echo "3. Initialisation de la base de données..."
docker exec cleaning-app-backend npx prisma db push
docker exec cleaning-app-backend npm run prisma:seed

echo
echo "=== Application démarrée avec Docker ! ==="
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo "Base de données: localhost:5432"
echo
echo "Comptes de démonstration:"
echo "Admin: admin@cleaning.com / admin123"
echo "Agent: marie.dupont@cleaning.com / agent123"
echo
echo "Pour arrêter: docker-compose down"
echo "Pour voir les logs: docker-compose logs -f"