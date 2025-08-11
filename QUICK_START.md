# 🚀 Démarrage Rapide - Application de Gestion des Agents d'Entretien

## Option 1: Démarrage avec Docker (Recommandé) ⚡

### Windows
1. Double-cliquez sur `start-docker.bat`

### Linux/Mac
```bash
chmod +x start-docker.sh
./start-docker.sh
```

## Option 2: Démarrage Manuel 🔧

### Prérequis
- Node.js 18+
- PostgreSQL 15
- Git

### Windows
1. Double-cliquez sur `start-dev.bat`

### Linux/Mac
```bash
chmod +x start-dev.sh
./start-dev.sh
```

## 🌐 Accès à l'Application

Une fois démarrée, accédez à :
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Base de données**: localhost:5432

## 👤 Comptes de Test

### Administrateur
- **Email**: `admin@cleaning.com`
- **Mot de passe**: `admin123`

### Agents d'Entretien
- **Email**: `marie.dupont@cleaning.com` | **Mot de passe**: `agent123`
- **Email**: `pierre.martin@cleaning.com` | **Mot de passe**: `agent123`
- **Email**: `sophie.bernard@cleaning.com` | **Mot de passe**: `agent123`

## 🎯 Fonctionnalités à Tester

### En tant qu'Administrateur
1. **Connexion** avec le compte admin
2. **Dashboard** - Voir les métriques globales et jauges visuelles
3. **Agents** - Ajouter/modifier/supprimer des agents
4. **Lieux** - Créer la hiérarchie des espaces (RDC, 1er étage, etc.)
5. **Tâches** - Créer et assigner des tâches aux agents
6. **Suivi Performance** - Visualiser les pourcentages de travail par agent

### En tant qu'Agent
1. **Connexion** avec un compte agent
2. **Dashboard Personnel** - Voir ses propres statistiques
3. **Mes Tâches** - Voir uniquement les tâches assignées
4. **Gestion des Tâches**:
   - Cliquer sur "Démarrer" pour une tâche en attente
   - Cliquer sur "Terminer" pour une tâche en cours
   - Saisir la durée réelle de la tâche

## 🔄 Redémarrage

### Docker
```bash
docker-compose down
docker-compose up --build -d
```

### Manuel
- Arrêter les processus avec `Ctrl+C`
- Relancer les scripts de démarrage

## 🆘 Problèmes Courants

### Port déjà utilisé
- Changer les ports dans `docker-compose.yml` ou arrêter les services existants

### Base de données
- Vérifier que PostgreSQL est démarré
- Contrôler la connexion avec la DATABASE_URL

### Permissions (Linux/Mac)
```bash
chmod +x *.sh
```

## 📊 Points Forts de l'Application

- ✅ **Interface moderne** avec Material-UI
- ✅ **Jauges animées** pour les métriques
- ✅ **Gestion des rôles** (Admin/Agent)
- ✅ **CRUD complet** pour tous les éléments
- ✅ **Temps réel** - Statistiques mises à jour automatiquement
- ✅ **Responsive** - Fonctionne sur mobile/tablette
- ✅ **Sécurité** - Authentification JWT

Bon test ! 🎉