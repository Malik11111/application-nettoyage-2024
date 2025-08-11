# 🚀 Cleaning App - Production Railway

Application complète de gestion des agents d'entretien avec tableau de bord temps réel.

## ⚡ Déploiement Railway

### 📦 Ce projet est prêt pour Railway !

**Services détectés automatiquement :**
- ✅ Backend Node.js (Port automatique)
- ✅ PostgreSQL Database (Incluse)
- ✅ Frontend React (Build automatique)

### 🔧 Configuration requise

**Variables d'environnement Railway :**
```
NODE_ENV=production
JWT_SECRET=votre-secret-jwt-super-securise-changez-moi
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://votre-app.up.railway.app
BCRYPT_ROUNDS=12
```

### 📋 Comptes par défaut

Après déploiement, ces comptes seront créés :

**🔱 SUPER ADMIN :**
- Email : `admin@cleaning.com`
- Mot de passe : `123456`

**🏢 ÉTABLISSEMENTS (1-10) :**
- Admins : `admin1@etablissement.com` à `admin10@etablissement.com`
- Agents : `agent1a@etablissement.com` à `agent10a@etablissement.com`
- Mot de passe : `123456` pour tous

### 🎯 URLs de test

Une fois déployé :
- **API Health :** `/api/health`
- **Login :** `/login`
- **Dashboard :** `/dashboard`

### 📱 Fonctionnalités

- ✅ Multi-tenant (plusieurs organisations)
- ✅ Authentification JWT sécurisée
- ✅ Interface responsive (tablettes/mobile)
- ✅ Timer temps réel pour agents
- ✅ Planning hebdomadaire automatique
- ✅ Dashboard avec métriques live

### 🔐 Sécurité

- Authentification JWT
- Rate limiting
- CORS configuré
- Headers sécurisés
- Mots de passe hashés

---

**🚀 Prêt pour la production !**