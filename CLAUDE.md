# 📋 Guide Claude Code - Application de Gestion des Agents d'Entretien

> **IMPORTANT** : Ce fichier contient toutes les informations nécessaires pour comprendre et dépanner cette application. Lisez-le attentivement avant toute intervention.

## 🏗️ Architecture de l'Application

### Vue d'ensemble
- **Type** : Application web complète de gestion des agents d'entretien
- **Architecture** : Multi-tenant avec support de plusieurs organisations
- **Technologies** : React + TypeScript + Node.js + Express + Prisma + PostgreSQL
- **Ports** : Frontend (3000/3005), Backend (3001/5000), Base de données (5432)

### Structure des dossiers
```
cleaning-app/
├── backend/          # API Node.js + Express + Prisma
├── frontend/         # Interface React + TypeScript + Material-UI
├── monitoring/       # Stack Prometheus/Grafana/Loki
├── nginx/           # Configuration reverse proxy
├── scripts/         # Scripts de déploiement et maintenance
└── docker-compose.yml
```

## 👥 Architecture Multi-Tenant

### Hiérarchie des rôles
1. **SUPER_ADMIN** : Voit TOUTES les organisations, peut créer de nouvelles organisations
2. **ADMIN** : Voit UNIQUEMENT son organisation, gère users/lieux/tâches
3. **AGENT** : Voit uniquement ses tâches assignées

### Comptes par défaut

**🔱 SUPER ADMIN (Voit tout) :**
- Email : `admin@cleaning.com`
- Mot de passe : `123456`
- Accès : Dashboard global, création d'organisations

**🏢 10 ÉTABLISSEMENTS (Créés par `create10Organizations.ts`) :**
```
Établissement 1-10 :
- Admin : admin1@etablissement.com à admin10@etablissement.com
- Agent A : agent1a@etablissement.com à agent10a@etablissement.com  
- Agent B : agent1b@etablissement.com à agent10b@etablissement.com
- Mot de passe : 123456 pour tous
```

**🏨 ORGANISATIONS DE TEST (Créés par `createTestOrganizations.ts`) :**
- Hôtel Luxe Paris : admin@hotel-luxe-paris.com
- Clinique Saint-Antoine : admin@clinique-saint-antoine.fr
- Bureau Central : admin@bureau-central.com

## 🚀 Comment démarrer l'application

### Option 1 : Docker (Recommandé)
```bash
cd "C:\Users\os\Desktop\CLAUDE-\cleaning-app"
docker-compose up --build -d
# URL : http://localhost:3000
```

### Option 2 : Mode développement
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
# URL : http://localhost:3005
```

### Scripts disponibles
- `start-docker.bat` - Démarre avec Docker
- `start-dev.bat` - Démarre en mode développement
- `restart.bat` - Redémarrage rapide

## 🔧 Problèmes connus et solutions

### 1. Page blanche après connexion
**Cause** : Données obsolètes dans localStorage ou erreurs JavaScript
**Solution** :
```javascript
// Dans la console F12 :
localStorage.clear();
sessionStorage.clear();
location.reload();
```
Ou utiliser le mode incognito (Ctrl + Shift + N)

### 2. Erreur "Button is not defined"
**Cause** : Import manquant dans Dashboard.tsx
**Solution** : Vérifier que `Button` est importé de `@mui/material`

### 3. Erreur "organizations.map is not a function"
**Cause** : API retourne des données invalides
**Solution** : Vérification `Array.isArray(organizations)` déjà implémentée

### 4. Erreur "org_default hors de portée"
**Cause** : Organisation non trouvée dans le sélecteur
**Solution** : Corrections déjà appliquées dans OrganizationSelector.tsx

### 5. Erreur 409 lors création admin avec même email
**Cause** : Système multi-tenant mal configuré
**Solution** : ✅ **CORRIGÉ** - Support de même email dans différentes organisations

### 6. Erreur 500 lors création de lieux
**Cause** : Middleware extractOrganization manquant
**Solution** : ✅ **CORRIGÉ** - Middleware ajouté aux routes nécessaires

### 7. Boutons DÉMARRER/TERMINER ne fonctionnent pas
**Cause** : Timer et logique de statut défaillants
**Solution** : ✅ **CORRIGÉ** - Timer temps réel fonctionnel

### 8. Planning hebdomadaire non respecté
**Cause** : Système de génération automatique obsolète
**Solution** : ✅ **CORRIGÉ** - Génération respecte le planning hebdomadaire

### 9. Interface agent trop complexe
**Cause** : Multiple onglets et vues confuses
**Solution** : ✅ **CORRIGÉ** - Interface simplifiée en une seule page

## 🗃️ Base de données

### Schéma principal
- **Organizations** : Multi-tenant avec slug, domaines, plans
- **Users** : Rôles hiérarchiques avec contrainte email/organisation
- **Locations** : Lieux avec coefficients de nettoyage
- **Tasks** : Gestion complète des tâches avec statuts
- **Templates** : Modèles de nettoyage et planning

### Scripts utiles
```bash
# Créer les 10 établissements
cd backend && npm run tsx scripts/create10Organizations.ts

# Créer organisations de test
cd backend && npm run tsx scripts/createTestOrganizations.ts

# Reset mot de passe admin
cd backend && npm run tsx scripts/resetAdminPassword.ts

# Migration multi-tenant
cd backend && npm run tsx scripts/migrateToMultiTenant.ts

# Maintenance quotidienne
cd backend && npm run tsx scripts/dailyMaintenance.ts

# Ajouter tous les lieux RDC avec surfaces (20m² = 30min)
cd backend && npm run tsx scripts/addAllRDCLocations.ts

# Correction planning hebdomadaire
cd backend && npm run tsx scripts/fixWeeklyScheduleGeneration.ts
```

## 🛠️ Développement et maintenance

### Commandes importantes
```bash
# Backend
npm run dev          # Mode développement
npm run build        # Build production
npm run prisma:push  # Synchroniser le schéma DB
npm run prisma:seed  # Peupler la DB

# Frontend
npm run dev          # Mode développement avec Vite
npm run build        # Build production
npm run preview      # Préview du build
```

### Structure des composants
```
frontend/src/
├── components/      # Composants réutilisables
│   ├── Charts/      # Graphiques (CircularProgress, LinearProgress)
│   ├── Layout/      # Layout principal avec navigation
│   ├── OrganizationSelector/  # Sélecteur multi-tenant
│   └── ProtectedRoute/        # Protection des routes
├── pages/           # Pages de l'application
│   ├── Dashboard/   # Dashboard principal avec métriques
│   ├── Login/       # Page de connexion
│   ├── Users/       # Gestion utilisateurs
│   ├── Tasks/       # Gestion des tâches (Kanban/Calendrier)
│   └── Locations/   # Gestion des lieux
└── store/           # State management Redux
    └── slices/      # Slices Redux par entité
```

## 🔍 URLs et endpoints utiles

### Frontend
- http://localhost:3000 ou http://localhost:3005
- Dashboard : `/dashboard`
- Tâches : `/tasks` (vue Kanban et Calendrier)
- Utilisateurs : `/users`
- Lieux : `/locations`

### Backend API
- Health check : http://localhost:3001/api/health
- Auth : `/api/auth/login`, `/api/auth/me`
- Organizations : `/api/organizations`
- Users : `/api/users`
- Tasks : `/api/tasks`
- Locations : `/api/locations`

## 🎯 Tests de fonctionnement

### Test complet
1. **Connexion Super Admin** : `admin@cleaning.com` / `123456`
   - ✅ Voit le sélecteur d'organisations
   - ✅ Peut créer de nouvelles organisations
   - ✅ Dashboard avec métriques globales

2. **Connexion Admin Établissement** : `admin1@etablissement.com` / `123456`
   - ✅ Voit uniquement "Établissement 1"
   - ✅ Gère users/tâches/lieux de son établissement
   - ✅ Boutons de maintenance quotidienne

3. **Connexion Agent** : `agent1a@etablissement.com` / `123456`
   - ✅ Vue simplifiée avec ses tâches
   - ✅ Interface Kanban pour gérer les statuts
   - ✅ Minuteur pour tracker le temps

## 📊 Fonctionnalités principales

### Dashboard temps réel
- Métriques animées (jauges circulaires, barres de progression)
- Statistiques par statut de tâches
- Maintenance quotidienne (Reset compteurs, génération automatique)

### Gestion multi-tenant
- Isolation complète des données par organisation
- Sélecteur d'organisations pour Super Admin
- Création d'organisations via interface
- **Support ADMIN et SUPER_ADMIN** pour toutes les fonctionnalités

### Planning intelligent
- **Planning hebdomadaire avec horaires différents par jour** (Lundi-Dimanche)
- **Génération automatique QUOTIDIENNE à 6h00** respectant le planning hebdomadaire
- Templates de nettoyage personnalisables
- Calendrier intégré avec vue mensuelle
- **Affichage des VRAIS horaires** selon le planning configuré

### Interface moderne
- Material-UI avec thème dark/light
- Vue Kanban drag & drop pour les tâches
- **Interface Agent simplifiée** - une seule page condensée
- **Boutons DÉMARRER/TERMINER** avec temps qui défile en temps réel
- Graphiques interactifs et animations fluides

### Gestion des tâches avancée
- **Heure de début réelle** affichée pour les admins quand un agent clique COMMENCER
- Timer en temps réel pour suivi précis
- Statuts visuels avec couleurs (En attente, En cours, Terminé)
- Groupement par agent dans la vue admin

## 🚨 En cas de problème

### Checklist de dépannage
1. **Vérifier les ports** : `netstat -an | findstr :3000`
2. **Vider le cache navigateur** : Ctrl + Shift + Delete
3. **Consulter la console F12** pour les erreurs JavaScript
4. **Vérifier les logs backend** dans le terminal
5. **Tester l'API** : http://localhost:3001/api/health

### Logs importants
- Backend : Terminal où `npm run dev` s'exécute
- Frontend : Console F12 du navigateur
- Base de données : Vérifier que Prisma se connecte correctement

### Redémarrage complet
```bash
# Arrêter tous les processus
docker-compose down
# Ou Ctrl+C dans les terminals

# Redémarrer proprement
docker-compose up --build -d
# Ou relancer npm run dev dans chaque dossier
```

## 📈 Monitoring (Production)

L'application inclut une stack de monitoring complète :
- **Prometheus** : Collecte de métriques (port 9090)
- **Grafana** : Dashboards visuels (port 3030)
- **Loki + Promtail** : Agrégation de logs
- **Alertes** : Notifications automatiques

## 🔒 Sécurité

- Authentification JWT avec rotation de tokens
- Rate limiting multi-niveau (global, auth, API)
- Headers de sécurité (CORS, CSP, HSTS)
- Chiffrement des secrets et communications TLS
- Audit trail complet des actions

---

## ⚡ Actions rapides pour Claude Code

### Si l'utilisateur signale un problème :
1. **Lire ce fichier CLAUDE.md** pour comprendre le contexte
2. **Vérifier les ports** avec `netstat` ou `lsof`
3. **Consulter les logs** dans la console F12
4. **Tester l'API** avec `curl http://localhost:3001/api/health`
5. **Appliquer les solutions** listées ci-dessus

### Commandes de diagnostic :
```bash
# Vérifier les services
curl -I http://localhost:3000
curl -s http://localhost:3001/api/health

# Vérifier les ports occupés
netstat -an | findstr ":3000\|:3001\|:5000"

# Logs temps réel
docker-compose logs -f
```

Cette application est **production-ready** avec toutes les bonnes pratiques modernes. La plupart des problèmes sont liés au cache navigateur ou aux données obsolètes dans localStorage.

**🎯 URL de test principal : http://localhost:3000 (Docker) ou http://localhost:3005 (Dev)**
**🔑 Compte de test : admin@cleaning.com / 123456**

---

## 📋 Historique des corrections et améliorations récentes

### ✅ Corrections majeures effectuées:
1. **Système multi-tenant corrigé** - Support de même email dans différentes organisations
2. **Planning hebdomadaire implémenté** - Horaires différents par jour (Lundi-Dimanche)
3. **Interface Agent simplifiée** - Une seule page au lieu des multiples onglets
4. **Timer temps réel fonctionnel** - Boutons DÉMARRER/TERMINER opérationnels
5. **Middleware extractOrganization ajouté** - Plus d'erreur 500 lors création de lieux
6. **Support ADMIN et SUPER_ADMIN** - Toutes les fonctionnalités accessibles aux deux rôles
7. **Génération automatique corrigée** - Respecte le planning hebdomadaire configuré
8. **Affichage horaires réels** - Interface agent montre les VRAIS horaires du planning
9. **Script RDC automatisé** - Tous les lieux RDC ajoutés avec surfaces (20m² = 30min)
10. **Responsivité vérifiée** - Application fonctionne sur mobile/tablette

### 🔄 Modifications récentes de l'interface:
- **Interface admin restaurée** - Design simple et clair comme avant
- **Vue tableau standard** - Headers et filtres basiques sans styling excessif
- **Fonctionnalités conservées** - Toute la logique métier reste intacte

### 🚀 Prochaines améliorations possibles:
- Notifications push en temps réel
- Export des rapports en PDF/Excel
- Intégration calendrier externe (Google Calendar)
- Mode hors ligne pour les agents
- Analytics avancées des performances

### ⏰ Système de génération automatique:
- **Génération quotidienne automatique à 6h00** (heure française)
- Utilise le **planning hebdomadaire configuré** pour chaque organisation
- Respecte les **différents horaires par jour** (Lundi = planning lundi, Mardi = planning mardi, etc.)
- Génère uniquement les tâches si le jour est **actif** dans le planning hebdomadaire
- Utilise le **planning par défaut** pour les agents sans planning spécifique
- **Évite la duplication** - ne génère pas si les tâches existent déjà

**📝 Note : Ce fichier CLAUDE.md est automatiquement lu par Claude Code lors de nouvelles sessions pour maintenir le contexte.**