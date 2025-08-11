# Application de Gestion des Agents d'Entretien

Une application complète de gestion des agents d'entretien avec tableau de bord en temps réel, gestion des tâches, et métriques de performance.

## 🚀 Fonctionnalités

- **Authentification sécurisée** avec JWT
- **Gestion des rôles** (Admin/Agent)
- **Tableau de bord interactif** avec métriques en temps réel
- **Gestion complète des agents** (CRUD)
- **Gestion des lieux** organisée par étages
- **Attribution et suivi des tâches**
- **Jauges visuelles élégantes** pour les pourcentages de travail
- **Interface responsive** et moderne

## 🛠 Stack Technique

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** avec **PostgreSQL**
- **JWT** pour l'authentification
- **Zod** pour la validation des données

### Frontend
- **React 18** + **TypeScript**
- **Material-UI** (MUI) pour l'interface
- **Redux Toolkit** pour la gestion d'état
- **Axios** pour les requêtes API

### Base de données
- **PostgreSQL 15**

## 📦 Installation et Démarrage

### Prérequis
- Node.js 18+
- PostgreSQL 15
- npm ou yarn

### Option 1: Démarrage avec Docker (Recommandé)

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd cleaning-app
   ```

2. **Démarrer avec Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Initialiser la base de données** (première fois seulement)
   ```bash
   docker exec -it cleaning-app-backend npx prisma db push
   docker exec -it cleaning-app-backend npm run prisma:seed
   ```

4. **Accéder à l'application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Base de données: localhost:5432

### Option 2: Démarrage Manuel

1. **Base de données PostgreSQL**
   ```bash
   # Créer une base de données PostgreSQL nommée "cleaning_app"
   createdb cleaning_app
   ```

2. **Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Modifier DATABASE_URL dans .env si nécessaire
   npx prisma db push
   npm run prisma:seed
   npm run dev
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 👤 Comptes de Démonstration

### Administrateur
- **Email**: admin@cleaning.com
- **Mot de passe**: admin123

### Agents
- **Email**: marie.dupont@cleaning.com | **Mot de passe**: agent123
- **Email**: pierre.martin@cleaning.com | **Mot de passe**: agent123
- **Email**: sophie.bernard@cleaning.com | **Mot de passe**: agent123

## 🎯 Utilisation

### Pour les Administrateurs
1. **Connexion** avec le compte admin
2. **Gestion des agents** - Ajouter/modifier/supprimer des agents
3. **Gestion des lieux** - Créer la hiérarchie des espaces
4. **Attribution des tâches** - Assigner des tâches aux agents
5. **Suivi des performances** - Visualiser les métriques de chaque agent

### Pour les Agents
1. **Connexion** avec un compte agent
2. **Voir les tâches assignées**
3. **Démarrer une tâche** (statut: En cours)
4. **Marquer comme terminé** avec durée réelle
5. **Consulter ses statistiques personnelles**

## 📊 Fonctionnalités du Tableau de Bord

### Métriques Globales
- Nombre total de tâches
- Tâches terminées/en cours/en attente
- Nombre d'agents actifs

### Jauges Visuelles
- **Taux de complétion global** (gauge circulaire)
- **Répartition des tâches** (barres de progression)
- **Performance par agent** (graphiques individuels)

### Statistiques en Temps Réel
- Mise à jour automatique toutes les 30 secondes
- Calcul des pourcentages de travail
- Heures travaillées par agent
- Efficacité (temps estimé vs temps réel)

## 🏗 Structure du Projet

```
cleaning-app/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── controllers/     # Logique métier
│   │   ├── routes/         # Routes Express
│   │   ├── middleware/     # Authentification, validation
│   │   ├── services/       # Services (base de données)
│   │   └── types/          # Types TypeScript
│   ├── prisma/             # Schéma et migrations
│   └── package.json
├── frontend/               # Interface React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages principales
│   │   ├── store/          # Redux store et slices
│   │   ├── services/       # API calls
│   │   └── types/          # Types TypeScript
│   └── package.json
└── docker-compose.yml      # Configuration Docker
```

## 🔧 Scripts Disponibles

### Backend
```bash
npm run dev          # Démarrage en mode développement
npm run build        # Build production
npm start            # Démarrage production
npm run prisma:push  # Appliquer le schéma à la DB
npm run prisma:seed  # Peupler avec des données de test
```

### Frontend
```bash
npm run dev          # Démarrage en mode développement
npm run build        # Build production
npm run preview      # Prévisualisation du build
```

## 🌟 Fonctionnalités Avancées

### Gestion des Permissions
- **Admins**: Accès complet à toutes les fonctionnalités
- **Agents**: Accès limité à leurs propres tâches et statistiques

### Interface Responsive
- Optimisée pour desktop, tablette et mobile
- Menu latéral adaptatif
- Cartes et jauges redimensionnables

### Animations et UX
- Transitions fluides sur les composants
- Loading states et feedback utilisateur
- Jauges animées pour les métriques

## 🔐 Sécurité

- Authentification JWT sécurisée
- Hachage des mots de passe avec bcrypt
- Validation des données avec Zod
- Protection des routes par rôle
- Gestion des erreurs complète

## 📱 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur actuel

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `POST /api/users` - Créer un utilisateur (Admin)
- `PUT /api/users/:id` - Modifier un utilisateur (Admin)
- `DELETE /api/users/:id` - Supprimer un utilisateur (Admin)

### Lieux
- `GET /api/locations` - Liste des lieux
- `POST /api/locations` - Créer un lieu (Admin)
- `PUT /api/locations/:id` - Modifier un lieu (Admin)
- `DELETE /api/locations/:id` - Supprimer un lieu (Admin)

### Tâches
- `GET /api/tasks` - Liste des tâches
- `POST /api/tasks` - Créer une tâche (Admin)
- `PUT /api/tasks/:id` - Modifier une tâche
- `DELETE /api/tasks/:id` - Supprimer une tâche (Admin)

### Tableau de bord
- `GET /api/dashboard/stats` - Statistiques globales
- `GET /api/dashboard/agent/:id` - Statistiques d'un agent

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 License

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.