# 🔱 Guide Utilisateur - SUPER ADMINISTRATEUR

> **Rôle** : Administrateur Général - Gestion de toutes les organisations et supervision globale

---

## 🚀 Première connexion

### 1. Accéder à l'application
- **URL** : `http://localhost:3000` (Docker) ou `http://localhost:3005` (Dev)
- **Email** : `admin@cleaning.com`
- **Mot de passe** : `123456`

### 2. Interface d'accueil
Après connexion, vous arrivez sur le **Dashboard Super Admin** avec :
- Vue d'ensemble de toutes les organisations
- Statistiques globales
- Accès au sélecteur d'organisations

---

## 🏢 Gestion des Organisations

### Créer une nouvelle organisation

1. **Dans le header**, cliquez sur le sélecteur d'organisations
2. Cliquez sur **"➕ Nouvelle Organisation"**
3. Remplissez le formulaire :
   - **Nom** : Ex. "Hôpital Saint-Martin"
   - **Slug** : Ex. "hopital-saint-martin" (généré automatiquement)
   - **Description** : Optionnel
   - **Plan** : Choisir le plan tarifaire
4. Cliquez **"Créer"**

### Changer d'organisation active

1. **Dans le header**, cliquez sur le sélecteur d'organisations
2. Sélectionnez l'organisation dans la liste déroulante
3. L'interface se met à jour automatiquement avec les données de cette organisation

---

## 👥 Gestion des Administrateurs d'Établissement

### Créer un admin pour une organisation

1. **Sélectionner l'organisation** dans le sélecteur
2. Aller dans **"Agents"** (menu de gauche)
3. Cliquer **"Nouvel Utilisateur"**
4. Remplir les informations :
   - **Nom** : Ex. "Jean Dupont"
   - **Email** : Ex. "admin@hopital-saint-martin.fr"
   - **Mot de passe** : Ex. "motdepasse123"
   - **Rôle** : Sélectionner **"Administrateur"**
5. Cliquer **"Créer"**

### Gérer les accès

- **Réinitialiser mot de passe** : Cliquer sur l'icône d'édition puis modifier
- **Changer de rôle** : Éditer l'utilisateur et changer ADMIN ↔ AGENT
- **Supprimer un compte** : Cliquer sur l'icône de suppression (🗑️)

---

## 📊 Supervision Globale

### Dashboard Principal

Le dashboard vous donne une vue d'ensemble :

1. **Statistiques générales**
   - Nombre total d'organisations
   - Nombre total d'utilisateurs
   - Activité récente

2. **Métriques par organisation**
   - Tâches en cours
   - Agents actifs
   - Performance globale

### Navigation entre les vues

- **Dashboard Global** : Vue d'ensemble de tout le système
- **Dashboard d'organisation** : Cliquer sur une organisation pour voir ses détails
- **Retour à la vue globale** : Sélectionner "Vue Globale" dans le sélecteur

---

## 🔧 Maintenance et Administration

### Opérations quotidiennes

En tant que Super Admin, vous pouvez :

1. **Surveiller toutes les organisations**
2. **Créer de nouvelles organisations** selon les besoins
3. **Gérer les administrateurs** de chaque établissement
4. **Accéder aux données** de n'importe quelle organisation

### Résolution de problèmes

1. **Organisation inaccessible** :
   - Vérifier que l'organisation existe dans le sélecteur
   - Contrôler que l'admin a les bons droits

2. **Problème de connexion admin** :
   - Réinitialiser le mot de passe depuis la gestion des utilisateurs
   - Vérifier que le rôle est bien "Administrateur"

3. **Données manquantes** :
   - Sélectionner la bonne organisation dans le header
   - Rafraîchir la page si nécessaire

---

## ⚙️ Fonctionnalités Avancées

### Accès aux données techniques

En mode Super Admin, vous avez accès à :
- **Toutes les organisations** créées dans le système
- **Tous les utilisateurs** (admins et agents) de toutes les organisations
- **Statistiques globales** de performance
- **Logs d'activité** de toute la plateforme

### Gestion des organisations existantes

**Organisations de test disponibles :**
- Hôtel Luxe Paris : `admin@hotel-luxe-paris.com`
- Clinique Saint-Antoine : `admin@clinique-saint-antoine.fr`
- Bureau Central : `admin@bureau-central.com`

**10 Établissements créés automatiquement :**
- Établissement 1 à 10 : `admin1@etablissement.com` à `admin10@etablissement.com`

---

## 🚨 Points d'attention

### ⚠️ Important à retenir

1. **Sélection d'organisation obligatoire** : Toujours vérifier quelle organisation est sélectionnée
2. **Droits étendus** : Vous voyez TOUTES les données, soyez prudent
3. **Création d'admins** : Chaque organisation doit avoir au moins un administrateur
4. **Sécurité** : Ne partagez jamais les identifiants Super Admin

### 🔒 Bonnes pratiques

- **Créer un admin dédié** pour chaque nouvelle organisation
- **Utiliser des mots de passe forts** pour les comptes administrateurs
- **Vérifier régulièrement** l'activité des organisations
- **Documenter** les changements importants

---

## 📞 Support

En cas de problème technique :
1. Consulter le fichier `CLAUDE.md` pour les solutions courantes
2. Vérifier la console F12 pour les erreurs JavaScript
3. Redémarrer l'application si nécessaire
4. Vider le cache navigateur en cas de problème d'affichage

**🎯 Votre mission : Superviser et administrer toutes les organisations du système de gestion d'entretien.**