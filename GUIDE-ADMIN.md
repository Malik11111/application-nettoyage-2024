# 🏢 Guide Utilisateur - ADMINISTRATEUR D'ÉTABLISSEMENT

> **Rôle** : Administrateur local - Gestion complète de votre établissement (agents, lieux, tâches, planning)

---

## 🚀 Première connexion

### 1. Accéder à l'application
- **URL** : `http://localhost:3000` (Docker) ou `http://localhost:3005` (Dev)
- **Comptes de test disponibles** :
  - `admin1@etablissement.com` / `123456` (Établissement 1)
  - `admin2@etablissement.com` / `123456` (Établissement 2)
  - ... jusqu'à `admin10@etablissement.com` / `123456`

### 2. Interface d'accueil
Après connexion, vous arrivez sur le **Dashboard Administrateur** avec :
- Métriques de votre établissement
- Vue d'ensemble des tâches du jour
- Boutons de maintenance quotidienne

---

## 👥 Gestion des Agents

### Ajouter un nouvel agent

1. **Menu de gauche** → Cliquer sur **"Agents"**
2. Cliquer sur **"Nouvel Utilisateur"**
3. Remplir les informations :
   - **Nom** : Ex. "Marie Martin"
   - **Email** : Ex. "marie.martin@monorgnisation.com"
   - **Mot de passe** : Créer un mot de passe temporaire
   - **Rôle** : Sélectionner **"Agent"**
4. Cliquer **"Créer"**

### Gérer les agents existants

- **Voir la liste** : Tous vos agents apparaissent dans le tableau
- **Modifier un agent** : Cliquer sur l'icône d'édition (✏️)
- **Supprimer un agent** : Cliquer sur l'icône de suppression (🗑️)
- **Changer le mot de passe** : Éditer l'agent et saisir un nouveau mot de passe

---

## 📍 Gestion des Lieux

### Ajouter un nouveau lieu

1. **Menu de gauche** → Cliquer sur **"Lieux"**
2. Cliquer sur **"Nouveau Lieu"**
3. Remplir les informations :
   - **Nom** : Ex. "Salle de réunion A"
   - **Étage** : Ex. "1er étage"
   - **Surface (m²)** : Ex. "25"
   - **Coefficient** : Ex. "1.2" (difficulté de nettoyage)
4. Cliquer **"Créer"**

### Calcul automatique des durées

Le système calcule automatiquement le temps de nettoyage :
- **Base** : 20m² = 30 minutes
- **Avec coefficient** : Surface × coefficient × (30min/20m²)
- **Exemple** : 25m² × 1.2 × 1.5 = 45 minutes

---

## ⏰ Gestion du Planning Hebdomadaire

### Configurer les horaires de travail

1. **Menu de gauche** → Cliquer sur **"Générateur Planning"**
2. Aller dans l'onglet **"Planning Hebdomadaire"**
3. **Pour chaque jour de la semaine** :
   - **Cocher** "Activer ce jour" si travaillé
   - **Heure de début** : Ex. "07:00"
   - **Heure de fin** : Ex. "15:30" 
   - **Pause début** : Ex. "11:00" (optionnel)
   - **Pause fin** : Ex. "12:00" (optionnel)
4. Cliquer **"Sauvegarder Planning"**

### Exemple de configuration typique

| Jour | Actif | Début | Fin | Pause |
|------|-------|--------|------|-------|
| Lundi | ✅ | 07:00 | 15:30 | 11:00-12:00 |
| Mardi | ✅ | 07:00 | 15:30 | 11:00-12:00 |
| Mercredi | ✅ | 07:00 | 15:30 | 11:00-12:00 |
| Jeudi | ✅ | 07:00 | 15:30 | 11:00-12:00 |
| Vendredi | ✅ | 07:00 | 15:30 | 11:00-12:00 |
| Samedi | ❌ | - | - | - |
| Dimanche | ❌ | - | - | - |

---

## 📋 Gestion des Tâches

### Créer une tâche manuelle

1. **Menu de gauche** → Cliquer sur **"Tâches"**
2. Cliquer sur **"Nouvelle Tâche"**
3. Remplir le formulaire :
   - **Titre** : Ex. "Nettoyage bureau direction"
   - **Description** : Optionnel
   - **Lieu** : Sélectionner dans la liste
   - **Agent assigné** : Choisir un agent (optionnel)
   - **Priorité** : Faible, Moyenne, Haute, Urgente
   - **Durée estimée** : En minutes (calculée auto selon le lieu)
   - **Date et heure** : Planifier la tâche
4. Cliquer **"Créer"**

### Vue d'ensemble des tâches

Le tableau vous montre :
- **Groupement par agent** : Tâches organisées par personne
- **Statuts visuels** :
  - 🔴 En attente
  - 🔵 En cours  
  - 🟢 Terminée
- **Heure de début réelle** : Quand l'agent a commencé
- **Durée effective** : Temps réellement passé

### Actions disponibles

- **Éditer une tâche** : Cliquer sur l'icône d'édition (✏️)
- **Supprimer une tâche** : Cliquer sur l'icône de suppression (🗑️)
- **Voir les détails** : Toutes les informations dans le tableau

---

## 🔄 Génération Automatique

### Démarrage quotidien

1. **Dashboard** → Section **"Maintenance Quotidienne"**
2. Cliquer sur **"Démarrage Quotidien"**
3. Le système :
   - Génère les tâches pour aujourd'hui
   - Respecte le planning hebdomadaire configuré
   - Répartit les tâches selon les agents disponibles
   - Calcule les horaires automatiquement

### Autres opérations de maintenance

- **"Reset Compteurs"** : Remet à zéro les statistiques
- **"Recréer Planning"** : Régénère toutes les tâches
- **"Mise à jour Auto"** : Actualise les données

---

## 📊 Suivi et Statistiques

### Métriques principales

Le dashboard vous affiche :
- **Tâches du jour** : En attente, en cours, terminées
- **Performance des agents** : Temps moyen, efficacité
- **Zones les plus nettoyées** : Statistiques par lieu
- **Respect des horaires** : Ponctualité et dépassements

### Filtres disponibles

Dans la section "Tâches" :
- **Par statut** : Voir seulement les tâches en attente, en cours, ou terminées
- **Par agent** : Filtrer les tâches d'un agent spécifique
- **Par date** : Voir les tâches d'une journée particulière

---

## ⚙️ Fonctionnalités Avancées

### Templates de nettoyage

1. **Générateur Planning** → Onglet **"Templates"**
2. Créer des modèles de tâches récurrentes
3. Associer des lieux à des fréquences (quotidien, hebdomadaire)
4. Le système génère automatiquement selon ces templates

### Gestion des horaires spéciaux

- **Jours fériés** : Désactiver certains jours
- **Horaires variables** : Différents horaires selon les jours
- **Pauses multiples** : Gérer plusieurs pauses dans la journée

---

## 🚨 Situations Courantes

### ❓ Un agent ne voit pas ses tâches
**Solution** :
1. Vérifier que l'agent est bien créé avec le rôle "Agent"
2. S'assurer que des tâches lui sont assignées
3. Vérifier que les tâches sont pour aujourd'hui

### ❓ Les horaires ne correspondent pas
**Solution** :
1. Configurer le planning hebdomadaire
2. Relancer "Démarrage Quotidien"
3. Vérifier que le bon jour est activé

### ❓ Pas de tâches générées automatiquement
**Solution** :
1. Créer des lieux dans "Lieux"
2. Créer des agents dans "Agents"  
3. Configurer le planning hebdomadaire
4. Cliquer "Démarrage Quotidien"

---

## 🔒 Bonnes Pratiques

### Sécurité
- **Changer les mots de passe par défaut** des agents
- **Former les agents** à l'utilisation de leur interface
- **Vérifier régulièrement** les tâches terminées

### Organisation
- **Nommer clairement** les lieux (ex: "Bureau 101 - RDC")
- **Assigner des agents** à des zones spécifiques
- **Planifier à l'avance** les tâches importantes

### Suivi
- **Consulter quotidiennement** le dashboard
- **Ajuster les durées** si nécessaire selon la réalité terrain
- **Communiquer** avec les agents sur les priorités

---

## 📞 Support

En cas de problème :
1. Consulter ce guide étape par étape
2. Vérifier dans "Tâches" si tout est correctement configuré
3. Utiliser "Démarrage Quotidien" pour résoudre les problèmes de génération
4. Contacter le support technique si nécessaire

**🎯 Votre mission : Organiser efficacement le travail de nettoyage de votre établissement.**