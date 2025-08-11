# 🚀 Guide de Déploiement Railway

## ✅ Prérequis (Déjà fait !)
- [x] Configuration PostgreSQL
- [x] Variables d'environnement préparées
- [x] Scripts Railway créés

## 📋 Étapes de Déploiement

### 1. 🌐 Créer un compte Railway
1. Allez sur [railway.app](https://railway.app)
2. Cliquez "Sign up" 
3. Connectez-vous avec GitHub ou Google
4. Vérifiez votre email si nécessaire

### 2. 📦 Préparer votre projet
Votre dossier `cleaning-app` est prêt avec :
- ✅ `railway.json` - Configuration Railway
- ✅ `Procfile` - Commandes de démarrage
- ✅ `.env.railway` - Variables d'environnement
- ✅ Schema PostgreSQL configuré

### 3. 🚀 Déployer sur Railway

#### Option A: Via GitHub (Recommandé)
1. **Créer un dépôt GitHub :**
   - Allez sur github.com
   - Cliquez "New repository"
   - Nom : `cleaning-app-production`
   - Public ou Private (votre choix)
   - Cliquez "Create repository"

2. **Uploader votre code :**
   ```bash
   cd "C:\Users\os\Desktop\CLAUDE-\cleaning-app"
   git init
   git add .
   git commit -m "Initial commit - Production ready"
   git remote add origin https://github.com/VOTRE-USERNAME/cleaning-app-production.git
   git push -u origin main
   ```

3. **Connecter à Railway :**
   - Dans Railway, cliquez "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez votre dépôt `cleaning-app-production`
   - Railway détecte automatiquement Node.js

#### Option B: Via ZIP Upload
1. **Compresser votre dossier :**
   - Clic droit sur `cleaning-app`
   - "Envoyer vers > Dossier compressé"
   
2. **Upload sur Railway :**
   - Cliquez "New Project" > "Empty Project"
   - Drag & drop votre fichier ZIP

### 4. ⚙️ Configuration Railway

1. **Database :**
   - Railway ajoute automatiquement PostgreSQL
   - La variable `DATABASE_URL` est injectée automatiquement

2. **Variables d'environnement :**
   Dans Railway Dashboard > Variables, ajoutez :
   ```
   NODE_ENV=production
   JWT_SECRET=votre-secret-jwt-changez-moi-123456789
   JWT_EXPIRES_IN=24h
   CORS_ORIGIN=https://cleaning-app-production-XXXXX.up.railway.app
   BCRYPT_ROUNDS=12
   ```

3. **Domain :**
   - Railway génère automatiquement : `https://cleaning-app-production-XXXXX.up.railway.app`
   - Vous pouvez personnaliser le sous-domaine

### 5. 🎯 Configuration Frontend
Après déploiement du backend, mettez à jour l'URL de l'API :

Dans `frontend/src/services/api.ts` :
```javascript
const BASE_URL = 'https://VOTRE-BACKEND-URL.up.railway.app/api';
```

### 6. ✅ Test Final
1. **URL Backend :** `https://votre-backend.railway.app/api/health`
2. **URL Frontend :** `https://votre-frontend.railway.app`
3. **Login Super Admin :** `admin@cleaning.com` / `123456`

## 💰 Coûts Railway
- **Gratuit :** 500h/mois d'usage (largement suffisant pour commencer)
- **Pro :** $5/mois par service (backend + database + frontend = ~$15/mois)

## 🔧 Maintenance
- **Logs :** Visibles dans Railway Dashboard
- **Monitoring :** Métriques incluses
- **Scaling :** Automatique selon la charge
- **Backups :** Automatiques pour PostgreSQL

## 📱 Pour vos tablettes
Une fois déployé, vos agents iront sur :
`https://votre-app.railway.app`

## 🆘 Support
Si problème :
1. Railway Dashboard > Logs
2. Variables d'environnement
3. Database connection

---
**🎯 Objectif :** Application accessible 24/7 depuis n'importe où !**