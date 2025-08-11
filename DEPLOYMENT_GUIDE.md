# 🚀 Guide de Déploiement DigitalOcean

## 📋 Prérequis
- [x] Compte GitHub (pour héberger le code)
- [ ] Compte DigitalOcean 
- [ ] Nom de domaine (LWS)

## 🔧 Étapes de déploiement

### 1. Préparer le code sur GitHub

1. **Créer un repository GitHub** :
   ```bash
   # Sur GitHub.com, créer un nouveau repository "cleaning-app"
   ```

2. **Pousser le code** :
   ```bash
   cd "C:\Users\os\Desktop\CLAUDE-\cleaning-app"
   git init
   git add .
   git commit -m "Initial commit - Application de gestion d'agents"
   git remote add origin https://github.com/VOTRE-USERNAME/cleaning-app.git
   git push -u origin main
   ```

### 2. Créer le compte DigitalOcean

1. **Aller sur** : https://www.digitalocean.com
2. **Créer un compte** (5$ de crédit gratuit)
3. **Vérifier l'email** et ajouter un moyen de paiement

### 3. Créer la base de données

1. **Dans le dashboard DigitalOcean** :
   - Cliquer sur "Create" > "Databases"
   - Choisir PostgreSQL 14
   - Plan : Development ($15/mois)
   - Nom : `cleaning-db`

2. **Noter les informations de connexion** :
   - Host, Port, Database, Username, Password
   - Vous en aurez besoin pour l'app

### 4. Déployer avec App Platform

1. **Cliquer sur "Create" > "Apps"**
2. **Connecter GitHub** et choisir votre repository
3. **Configuration automatique** :
   - Backend détecté : Node.js
   - Frontend détecté : Node.js
4. **Variables d'environnement** :
   ```
   DATABASE_URL = postgresql://username:password@host:port/database
   JWT_SECRET = votre-secret-jwt-super-secure-2024
   NODE_ENV = production
   ```

### 5. Configurer le nom de domaine

1. **Dans l'app DigitalOcean** : onglet "Settings" > "Domains"
2. **Ajouter votre domaine** : cleaning.votre-site.com
3. **Dans LWS** : Créer un CNAME :
   ```
   cleaning.votre-site.com CNAME nom-app.ondigitalocean.app
   ```

### 6. Migration de la base de données

Une fois déployé, dans le terminal DigitalOcean :
```bash
npx prisma migrate deploy
npx prisma db seed
```

## ✅ Tests finaux

1. **Accéder à l'URL** : https://cleaning.votre-site.com
2. **Se connecter avec** : admin@cleaning.com / 123456
3. **Tester les fonctionnalités** de base
4. **Configurer les organisations** et utilisateurs

## 💰 Coûts estimés

- **App Platform** : $12/mois (backend + frontend)
- **Database** : $15/mois
- **Total** : ~$27/mois

## 🆘 En cas de problème

1. **Logs d'application** : Dashboard > Runtime Logs
2. **Status de déploiement** : Dashboard > Activity
3. **Base de données** : Dashboard > Databases > Insights

---

**📞 Support** : Je peux vous aider pour chaque étape !