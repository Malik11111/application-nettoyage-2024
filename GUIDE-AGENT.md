# 🧹 Guide Utilisateur - AGENT DE NETTOYAGE

> **Rôle** : Agent d'entretien - Interface simple pour gérer vos tâches quotidiennes

---

## 🚀 Première connexion

### 1. Accéder à l'application
- **URL** : `http://localhost:3000` (Docker) ou `http://localhost:3005` (Dev)
- **Comptes de test disponibles** :
  - `agent1a@etablissement.com` / `123456` (Agent A de l'Établissement 1)
  - `agent1b@etablissement.com` / `123456` (Agent B de l'Établissement 1)
  - ... jusqu'à `agent10a@etablissement.com` et `agent10b@etablissement.com`

### 2. Interface d'accueil
Après connexion, vous arrivez directement sur votre **planning du jour** avec :
- La date et l'heure actuelles
- Vos horaires de travail (début, pause, fin)
- La liste de vos tâches pour aujourd'hui
- Votre progression (combien de tâches terminées)

---

## 📅 Comprendre votre planning

### Informations affichées

En haut de l'écran vous voyez :

1. **Date du jour** : Ex. "Lundi 10 Août 2025"
2. **Heure actuelle** : Mise à jour en temps réel
3. **Vos horaires de travail** :
   - 🌅 **Début** : 7h00
   - ☕ **Pause** : 11h00-12h00  
   - 🌇 **Fin** : 15h30

4. **Votre progression** :
   - Barre de progression visuelle
   - "2/5 terminées" (par exemple)

### Statuts de vos tâches

Chaque tâche a un statut avec une couleur :
- **⏳ À faire** (gris) : Pas encore commencée
- **🔄 En cours** (bleu) : Vous avez cliqué COMMENCER
- **✅ Terminée** (vert) : Vous avez cliqué TERMINER

---

## ▶️ Démarrer une tâche

### Étapes à suivre

1. **Localiser la tâche** dans votre liste (ex: "Salle de réunion A")
2. **Lire les informations** :
   - **Lieu** : Où aller
   - **Heure prévue** : Quand commencer (ex: 08:00)
   - **Durée estimée** : Temps prévu (ex: 30min)
3. **Cliquer sur le bouton "COMMENCER"** quand vous êtes prêt

### Que se passe-t-il quand vous cliquez COMMENCER ?

- ✅ Le statut passe à **"En cours"** (bleu)
- ✅ Le **timer démarre** et compte le temps réel
- ✅ Votre administrateur voit l'heure de début réelle
- ✅ La tâche passe en haut de votre liste

---

## ⏹️ Terminer une tâche

### Quand cliquer TERMINER

1. **Quand le nettoyage est fini** et satisfaisant
2. **Tous les équipements rangés** et zone propre
3. **Prêt à passer** à la tâche suivante

### Étapes à suivre

1. **Cliquer sur "TERMINER"** sur la tâche en cours
2. La tâche passe automatiquement en **"Terminée"** (vert)
3. Le **temps réel** est enregistré
4. Votre **progression** se met à jour

### Que se passe-t-il après TERMINER ?

- ✅ Le timer s'arrête et sauvegarde le temps passé
- ✅ Votre administrateur voit que c'est fini
- ✅ La tâche descend dans la liste des terminées
- ✅ Vous pouvez commencer la suivante

---

## ⏰ Comprendre les horaires

### Heure prévue vs Heure réelle

- **Heure prévue** : Suggestion de votre administrateur (ex: 08:00)
- **Vous pouvez commencer** quand vous voulez dans votre journée
- **L'important** : respecter l'ordre de priorité des tâches

### Priorités des tâches

Vos tâches sont **automatiquement triées** par ordre d'importance :

1. **🏥 Infirmerie** (le plus urgent)
2. **📚 Classes** 
3. **🚽 Toilettes/Sanitaires**
4. **🔧 Ateliers**
5. **Autres lieux**

### Gestion du temps

- **Timer en temps réel** : Vous voyez exactement combien de temps vous passez
- **Durée prévue** : Temps estimé par l'administrateur
- **Durée réelle** : Temps que vous passez vraiment
- **Couleurs** : 
  - 🟢 Vert : Dans les temps
  - 🔴 Rouge : Dépassement (normal, pas de panique!)

---

## 📱 Interface mobile et pratique

### Utilisation sur smartphone/tablette

L'interface est **optimisée** pour les appareils mobiles :
- **Gros boutons** faciles à toucher
- **Texte lisible** même en petit écran
- **Une seule page** : tout est visible rapidement

### Conseils d'utilisation

1. **Gardez votre téléphone** avec vous pendant le travail
2. **Consultez régulièrement** pour voir le temps qui passe
3. **N'oubliez pas de cliquer TERMINER** à la fin de chaque tâche
4. **En cas de problème** : rafraîchir la page (glisser vers le bas)

---

## 🔄 Situations courantes

### ❓ Que faire si une tâche est impossible ?
- **Continuer les autres tâches** que vous pouvez faire
- **Informer votre superviseur** de vive voix ou par téléphone
- **NE PAS cliquer TERMINER** tant que ce n'est pas fait

### ❓ Que faire si je finis plus tôt que prévu ?
- **Cliquer TERMINER** quand c'est vraiment fini
- **Passer à la tâche suivante** directement
- Le système **enregistre votre efficacité** (c'est positif!)

### ❓ Que faire si ça prend plus de temps ?
- **Continuez normalement** jusqu'à ce que ce soit bien fait
- Le timer continue de compter (**pas de stress**)
- **La qualité** est plus importante que la vitesse
- Votre superviseur comprendra si c'était vraiment plus long

### ❓ Que faire si je n'ai pas de tâches ?
- **Vérifier que vous êtes connecté** avec le bon compte
- **Actualiser la page** (glisser vers le bas sur mobile)
- **Demander à votre superviseur** s'il faut générer les tâches du jour

---

## 📋 Votre journée type

### 🌅 Arrivée (7h00)
1. **Se connecter** sur l'application
2. **Consulter** la liste des tâches du jour
3. **Noter mentalement** les lieux prioritaires

### 🏃 Pendant la journée
1. **Commencer par les priorités** (infirmerie, classes...)
2. **Cliquer COMMENCER** avant de débuter chaque zone
3. **Travailler normalement** avec votre matériel
4. **Cliquer TERMINER** dès que c'est fini
5. **Passer à la suivante** sans attendre

### ☕ Pause (11h00-12h00)
1. **Terminer la tâche en cours** si possible avant la pause
2. **Laisser l'application ouverte** (elle se souvient de tout)
3. **Reprendre** après la pause là où vous en étiez

### 🏠 Fin de journée (15h30)
1. **Vérifier** que toutes les tâches sont TERMINÉES
2. **Dire au revoir** à votre superviseur
3. **Se déconnecter** de l'application

---

## ✅ Points importants à retenir

### ⚠️ À faire absolument
- ✅ **Cliquer COMMENCER** avant de débuter une zone
- ✅ **Cliquer TERMINER** quand c'est vraiment fini
- ✅ **Suivre l'ordre de priorité** des tâches
- ✅ **Garder l'application ouverte** pendant le travail

### ❌ À éviter
- ❌ Oublier de cliquer sur les boutons
- ❌ Fermer l'application en cours de tâche
- ❌ Cliquer TERMINER si le travail n'est pas fini
- ❌ Commencer par n'importe quelle tâche (respecter les priorités)

---

## 💡 Conseils pour bien utiliser l'application

### Pour être efficace
1. **Consultez le planning** en arrivant le matin
2. **Planifiez mentalement** votre parcours dans le bâtiment
3. **Respectez les priorités** automatiques du système
4. **N'hésitez pas** à prendre le temps qu'il faut pour bien faire

### Pour éviter les problèmes
1. **Ne fermez pas** l'application pendant une tâche
2. **Si vous vous trompez** de bouton, informez votre superviseur
3. **En cas de bug** : actualiser la page résout souvent le problème
4. **Gardez votre téléphone chargé** si vous l'utilisez

---

## 📞 Aide et support

### En cas de problème technique
1. **Actualiser la page** (glisser vers le bas sur mobile)
2. **Vérifier votre connexion** internet
3. **Demander de l'aide** à votre superviseur
4. **En dernier recours** : noter sur papier et rattraper plus tard

### En cas de question sur les tâches
- **Parler directement** avec votre superviseur
- **Toujours privilégier** la communication humaine pour les urgences
- **L'application est un outil**, votre jugement reste primordial

---

## 🎯 Votre mission

**Utiliser l'application pour organiser et tracker votre travail quotidien de nettoyage.**

L'application vous aide à :
- ✅ **Ne rien oublier** - toutes vos tâches sont listées
- ✅ **Être efficace** - les priorités sont calculées pour vous
- ✅ **Montrer votre travail** - votre superviseur voit vos efforts
- ✅ **Améliorer l'organisation** - les temps réels aident à mieux planifier

**Bonne journée et bon travail ! 🧹✨**