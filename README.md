# 🧹 Application de Gestion des Agents d'Entretien

Application de gestion des agents d'entretien optimisée pour Railway.

## 🚀 Déploiement Production
**URL :** https://web-production-f9c83.up.railway.app

## 🔐 Comptes de test
- **Super Admin :** `admin@cleaning.com` / `123456`
- **Admin :** `admin1@etablissement.com` / `123456`  
- **Agent :** `agent1a@etablissement.com` / `123456`

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

## 📦 Installation et Démarrage (Projet Nettoyé)

### Prérequis
- Node.js 18+ et npm 8+
- PostgreSQL 15+ (pour développement local)
- Docker et Docker Compose (recommandé)

### 🚀 Installation Rapide avec Docker (Recommandé)

1. **Cloner et installer**
   ```bash
   git clone <repository-url>
   cd cleaning-app
   npm run install:all  # Installation workspace complète
   ```

2. **Démarrer l'environnement complet**
   ```bash
   docker-compose up -d  # PostgreSQL + Backend + Frontend
   ```

3. **Initialiser la base de données** (première fois uniquement)
   ```bash
   npm run db:setup     # Génération Prisma + Push schema
   npm run db:seed      # Peuplement données de test
   ```

4. **Accéder à l'application**
   - 🌐 **Frontend**: http://localhost:3000
   - 🚀 **Backend API**: http://localhost:3001  
   - 🗄️ **PostgreSQL**: localhost:5432
   - 📊 **Prisma Studio**: `npm run prisma:studio` (dans backend/)

### 🛠️ Développement Manuel (Sans Docker)

1. **Installer toutes les dépendances**
   ```bash
   npm run install:all
   ```

2. **Base de données locale**
   ```bash
   createdb cleaning_app  # Créer la DB PostgreSQL
   ```

3. **Configuration environnement**
   ```bash
   cd backend
   cp .env.example .env
   # Éditer DATABASE_URL dans .env si nécessaire
   ```

4. **Démarrage complet**
   ```bash
   npm run db:setup     # Setup Prisma + Schema
   npm run db:seed      # Données de test
   npm run dev          # Backend + Frontend simultanés
   ```

### ⚡ Commandes de Développement Rapides
```bash
npm run dev          # Développement simultané (backend + frontend)
npm run build        # Build production complète
npm run test         # Tests complets
npm run lint         # Linting complet avec auto-fix
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

## 🏗 Structure du Projet (Nettoyé et Organisé)

```
cleaning-app/
├── backend/                      # API Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/          # Logique métier des contrôleurs
│   │   ├── routes/               # Routes Express API
│   │   ├── middleware/           # Authentification, validation, CORS
│   │   ├── services/             # Services base de données
│   │   ├── types/                # Types TypeScript partagés
│   │   └── index.ts              # Point d'entrée principal
│   ├── prisma/
│   │   ├── schema.prisma         # Schéma de base de données
│   │   ├── migrations/           # Migrations SQL
│   │   └── seed.ts               # Données de test
│   ├── scripts/
│   │   └── railwaySeeding.ts     # Script de seeding pour Railway
│   ├── tests/                    # Tests unitaires et d'intégration
│   ├── .env.example              # Variables d'environnement exemple
│   ├── .eslintrc.js              # Configuration ESLint
│   ├── jest.config.js            # Configuration Jest pour les tests
│   ├── tsconfig.json             # Configuration TypeScript
│   ├── Dockerfile                # Image Docker backend
│   └── package.json              # Dépendances backend
├── frontend/                     # Interface React + TypeScript + Vite
│   ├── src/
│   │   ├── components/           # Composants React réutilisables
│   │   ├── pages/                # Pages principales de l'application
│   │   ├── store/                # Redux Toolkit store et slices
│   │   ├── services/             # Services API (Axios)
│   │   ├── types/                # Types TypeScript frontend
│   │   ├── styles/               # Styles CSS/SCSS
│   │   ├── utils/                # Utilitaires partagés
│   │   └── App.tsx               # Composant principal React
│   ├── public/                   # Assets statiques
│   ├── .eslintrc.cjs             # Configuration ESLint
│   ├── tsconfig.json             # Configuration TypeScript
│   ├── vite.config.ts            # Configuration Vite
│   ├── Dockerfile                # Image Docker frontend (Nginx)
│   ├── nginx.conf                # Configuration Nginx pour production
│   └── package.json              # Dépendances frontend
├── .github/                      # GitHub Actions workflows
├── docker-compose.yml            # Développement local avec Docker
├── package.json                  # Scripts root et workspace config
├── .gitignore                    # Fichiers ignorés par Git (complet)
└── README.md                     # Documentation complète
```

### 🧹 Nettoyage Effectué

**Fichiers/Dossiers Supprimés :**
- `malik/` - Dossier vide
- `frontend-server/` - Configuration redondante
- `node_modules/` (root) - Node modules non nécessaire au niveau racine
- `frontend-package.json` et `frontend-railway.json` - Fichiers dupliqués
- Scripts de développement inutilisés dans `backend/scripts/`
- Fichiers de configuration Railway redondants
- Anciens fichiers de documentation (CLAUDE.md, DEPLOY_RAILWAY_FIXED.md, etc.)

**Améliorations Apportées :**
- Dependencies front-end complètement fixées (React, MUI, Redux Toolkit ajoutés)
- Configuration ESLint ajoutée pour backend et frontend  
- Package.json root configuré comme workspace avec scripts utiles
- .gitignore complet et professionnel
- Structure de projet claire et organisée

## 🔧 Scripts Disponibles

### Root (Niveau Projet)
```bash
npm run dev                 # Démarrage simultané backend + frontend
npm run build               # Build complet du projet
npm run test                # Tests backend + frontend
npm run lint                # Linting backend + frontend
npm run install:all         # Installation complète des dépendances
npm run db:setup            # Configuration base de données (Prisma)
npm run db:seed             # Peuplement données de test
```

### Backend
```bash
npm run dev          # Développement avec hot-reload (nodemon)
npm run build        # Build TypeScript vers JavaScript
npm start            # Démarrage production
npm run test         # Tests Jest
npm run lint         # ESLint avec auto-fix
npm run prisma:push  # Application du schéma à la DB
npm run prisma:seed  # Peuplement avec données de test
```

### Frontend  
```bash
npm run dev          # Serveur de développement Vite
npm run build        # Build production optimisé
npm run preview      # Prévisualisation du build local
npm run test         # Tests Vitest
npm run lint         # ESLint avec TypeScript
```

### Docker (Développement)
```bash
docker-compose up -d    # Démarrage environnement complet
docker-compose down     # Arrêt des services
docker-compose logs     # Visualisation des logs
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