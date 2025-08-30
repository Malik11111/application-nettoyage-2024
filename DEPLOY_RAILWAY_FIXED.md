# 🚀 Railway - Guide de Déploiement CORRIGÉ

## 🔧 **Problèmes résolus :**
- ✅ CORS trop restrictif
- ✅ Rate limiting trop strict 
- ✅ Headers de sécurité adaptés
- ✅ Configuration Railway optimisée

## 📋 **Déploiement en 3 étapes :**

### 1. 🌐 **Créer le compte Railway**
1. Allez sur [railway.app](https://railway.app)
2. Connectez-vous avec GitHub
3. Vérifiez votre email

### 2. 🔄 **Préparer le code**
```bash
# Remplacer l'ancien fichier de config
copy ".env.railway.fixed" ".env.railway"

# Commit et push sur GitHub
git add .
git commit -m "Fix: Railway security config"
git push
```

### 3. 🚀 **Déployer sur Railway**
1. **New Project** → **Deploy from GitHub**
2. Sélectionnez votre repo
3. **Add PostgreSQL** (base de données)
4. **Variables d'environnement** (copiez depuis `.env.railway.fixed`)

### 📌 **Variables Railway à définir :**
```env
NODE_ENV=production
JWT_SECRET=votre-secret-unique-123456789
CORS_ORIGIN=*
RATE_LIMIT_MAX=500
AUTH_RATE_LIMIT_MAX=20
API_RATE_LIMIT_MAX=200
```

### ✅ **Test après déploiement :**
- URL : `https://votre-app.up.railway.app/api/health`
- Login : `admin@cleaning.com` / `123456`

## 🛡️ **Sécurité adaptée Railway :**
- Rate limiting plus souple en production
- CORS permissif pour les sous-domaines Railway
- Headers de sécurité maintenus
- Protection contre les attaques courantes

## 💰 **Coût Railway :**
- **Gratuit** : 500h/mois (suffisant pour commencer)
- **Pro** : $5/mois par service (~$15/mois total)

**🎯 Maintenant Railway devrait fonctionner sans erreurs de sécurité !**