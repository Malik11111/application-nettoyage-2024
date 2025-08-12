# Dockerfile simple pour Railway
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers backend
COPY backend/package*.json ./
RUN npm install

# Copier le code source  
COPY backend/ ./

# Installer tsx globalement
RUN npm install -g tsx

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:./dev.db"
ENV JWT_SECRET="railway-secret-123456789"

EXPOSE 3000

# Commande de démarrage
CMD ["tsx", "src/index.ts"]