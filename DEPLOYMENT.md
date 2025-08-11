# Cleaning App - Guide de Déploiement Professionnel

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Architecture](#architecture)
4. [Configuration des Secrets](#configuration-des-secrets)
5. [Déploiement Staging](#déploiement-staging)
6. [Déploiement Production](#déploiement-production)
7. [Monitoring et Observabilité](#monitoring-et-observabilité)
8. [Sécurité](#sécurité)
9. [Maintenance](#maintenance)
10. [Dépannage](#dépannage)
11. [Rollback](#rollback)

## Vue d'ensemble

Cette application de gestion des agents d'entretien est conçue pour un déploiement professionnel avec les caractéristiques suivantes :

- **Architecture multi-conteneurs** : Frontend React, Backend Node.js, PostgreSQL, Redis, Nginx
- **Sécurité renforcée** : Rate limiting, CORS, headers de sécurité, secrets management
- **Monitoring complet** : Prometheus, Grafana, Loki pour les logs
- **CI/CD automatisé** : GitHub Actions avec tests et déploiement
- **Scalabilité** : Load balancing, cache Redis, optimisations performance
- **Haute disponibilité** : Health checks, auto-restart, backup automatiques

## Prérequis

### Système Requis

- **OS** : Linux Ubuntu 20.04+ ou CentOS 8+ (recommandé)
- **RAM** : Minimum 4GB, recommandé 8GB+
- **Stockage** : Minimum 20GB, recommandé 50GB+
- **CPU** : Minimum 2 cores, recommandé 4 cores+

### Logiciels Requis

```bash
# Docker et Docker Compose
docker --version  # >= 20.10.0
docker-compose --version  # >= 2.0.0

# Git
git --version  # >= 2.25.0

# OpenSSL (pour les certificats)
openssl version  # >= 1.1.1

# Outils système
curl --version
jq --version
```

### Ports Réseau

- **80** : HTTP (redirections HTTPS)
- **443** : HTTPS (application principale)
- **3003** : Grafana (monitoring)
- **9090** : Prometheus (métriques)
- **5432** : PostgreSQL (base de données)
- **6379** : Redis (cache)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Internet      │    │   Load Balancer │    │   Monitoring    │
│                 │────│   (Nginx)       │    │   (Grafana)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                       ┌─────────────────┐              │
                       │   Frontend      │              │
                       │   (React/Nginx) │              │
                       └─────────────────┘              │
                                │                        │
                       ┌─────────────────┐              │
                       │   Backend       │──────────────┘
                       │   (Node.js)     │
                       └─────────────────┘
                                │
                  ┌─────────────────┐    ┌─────────────────┐
                  │   Database      │    │   Cache         │
                  │   (PostgreSQL)  │    │   (Redis)       │
                  └─────────────────┘    └─────────────────┘
```

## Configuration des Secrets

### 1. Génération des Secrets

```bash
# Naviguer vers le répertoire de l'application
cd /path/to/cleaning-app

# Exécuter le script de configuration des secrets
./scripts/setup-secrets.sh
```

Ce script génère automatiquement :
- Mots de passe de base de données
- Clés JWT secrètes
- Mots de passe Redis
- Mots de passe d'administration Grafana

### 2. Vérification des Secrets

```bash
# Vérifier que tous les secrets ont été créés
ls -la secrets/
```

Fichiers attendus :
- `postgres_db.txt`
- `postgres_user.txt`
- `postgres_password.txt`
- `database_url.txt`
- `jwt_secret.txt`
- `redis_password.txt`
- `redis_url.txt`
- `grafana_admin_password.txt`

### 3. Sécurisation des Secrets

```bash
# Vérifier les permissions (doivent être 600)
ls -la secrets/

# Si nécessaire, corriger les permissions
chmod 600 secrets/*
```

## Déploiement Staging

### 1. Préparation de l'Environnement

```bash
# Cloner le repository
git clone <your-repository-url>
cd cleaning-app

# Créer la branche staging si elle n'existe pas
git checkout -b staging

# Configurer les secrets
./scripts/setup-secrets.sh
```

### 2. Configuration Staging

Créer le fichier `docker-compose.staging.yml` :

```yaml
version: '3.8'

services:
  # Copier docker-compose.prod.yml et ajuster :
  # - Ports différents si nécessaire
  # - Volumes de développement
  # - Variables d'environnement de staging
```

### 3. Déploiement

```bash
# Déployer en staging
./scripts/deploy.sh staging

# Vérifier le déploiement
./scripts/monitor.sh check
```

### 4. Tests Staging

```bash
# Tests de santé
curl -f http://localhost/api/health
curl -f http://localhost/api/health/detailed

# Tests fonctionnels
# Ajouter vos tests spécifiques ici
```

## Déploiement Production

### 1. Préparation du Serveur

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installation de Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Redémarrage pour appliquer les groupes
sudo reboot
```

### 2. Configuration Production

```bash
# Cloner l'application
sudo mkdir -p /opt/cleaning-app
sudo chown $USER:$USER /opt/cleaning-app
git clone <your-repository-url> /opt/cleaning-app
cd /opt/cleaning-app

# Basculer sur main
git checkout main

# Configuration des secrets
./scripts/setup-secrets.sh
```

### 3. Configuration SSL

```bash
# Option 1: Let's Encrypt (recommandé)
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copier les certificats
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Option 2: Certificats auto-signés (développement uniquement)
# Les certificats sont générés automatiquement par le script de déploiement
```

### 4. Configuration DNS

```bash
# Configurer vos enregistrements DNS :
# A yourdomain.com -> IP_SERVEUR
# A www.yourdomain.com -> IP_SERVEUR
```

### 5. Déploiement Production

```bash
# Mise à jour du domaine dans la configuration
sed -i 's/localhost/yourdomain.com/g' nginx/conf.d/app.conf
sed -i 's/yourdomain.com/yourdomain.com/g' backend/src/index.ts

# Déploiement
./scripts/deploy.sh production

# Vérification
./scripts/monitor.sh status
```

### 6. Configuration du Firewall

```bash
# UFW (Ubuntu)
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 3003/tcp # Grafana (optionnel, restreindre par IP)
sudo ufw reload

# Vérifier le statut
sudo ufw status
```

## Monitoring et Observabilité

### 1. Accès aux Interfaces de Monitoring

- **Grafana** : https://yourdomain.com:3003
  - Utilisateur : `admin`
  - Mot de passe : Voir `secrets/grafana_admin_password.txt`

- **Prometheus** : https://yourdomain.com:9090 (accès interne uniquement)

### 2. Dashboards Grafana

Les dashboards suivants sont disponibles :
- **Application Overview** : Métriques générales
- **Database Performance** : Performance PostgreSQL
- **System Resources** : CPU, RAM, disque
- **Error Monitoring** : Erreurs et alertes

### 3. Alertes

Les alertes sont configurées pour :
- Taux d'erreur élevé (>5%)
- Temps de réponse élevé (>1s)
- Utilisation CPU élevée (>80%)
- Utilisation mémoire élevée (>85%)
- Espace disque faible (<10%)
- Services indisponibles

### 4. Logs

```bash
# Voir les logs en temps réel
./scripts/monitor.sh logs

# Logs d'un service spécifique
./scripts/monitor.sh logs backend 50

# Logs d'erreur uniquement
docker-compose -f docker-compose.prod.yml logs | grep ERROR
```

## Sécurité

### 1. Headers de Sécurité

L'application implémente automatiquement :
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (en HTTPS)
- `Content-Security-Policy`
- `Referrer-Policy`

### 2. Rate Limiting

- **Global** : 1000 requêtes/15 minutes par IP
- **API** : 100 requêtes/minute par IP
- **Authentification** : 10 tentatives/heure par IP

### 3. CORS

Configuration stricte en production :
- Origins autorisés : domaines configurés uniquement
- Credentials : supportés avec restrictions
- Methods : GET, POST, PUT, PATCH, DELETE uniquement

### 4. Secrets Management

- Utilisation de Docker secrets
- Aucun secret en dur dans le code
- Rotation des secrets recommandée tous les 90 jours

### 5. Audit de Sécurité

```bash
# Vérification des vulnérabilités
./scripts/monitor.sh alerts

# Audit des dépendances (manuellement)
cd backend && npm audit
cd frontend && npm audit

# Scan des containers
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image cleaning-app-backend:production
```

## Maintenance

### 1. Sauvegardes

#### Sauvegarde Automatique

```bash
# Sauvegarde complète quotidienne
0 2 * * * /opt/cleaning-app/scripts/backup.sh production full

# Sauvegarde de la base de données toutes les 4 heures
0 */4 * * * /opt/cleaning-app/scripts/backup.sh production database
```

#### Sauvegarde Manuelle

```bash
# Sauvegarde complète
./scripts/backup.sh production full

# Sauvegarde base de données uniquement
./scripts/backup.sh production database

# Sauvegarde configuration uniquement
./scripts/backup.sh production config
```

### 2. Mise à Jour

```bash
# Mise à jour du code
git pull origin main

# Redéploiement
./scripts/deploy.sh production

# Vérification
./scripts/monitor.sh check
```

### 3. Rotation des Logs

```bash
# Configuration logrotate
sudo tee /etc/logrotate.d/cleaning-app << 'EOF'
/opt/cleaning-app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    postrotate
        docker-compose -f /opt/cleaning-app/docker-compose.prod.yml restart
    endscript
}
EOF
```

### 4. Nettoyage Système

```bash
# Nettoyage Docker (hebdomadaire)
docker system prune -f
docker volume prune -f
docker image prune -f

# Nettoyage des logs anciens
find /var/log -name "*.log" -type f -mtime +30 -delete
```

### 5. Mise à Jour des Dépendances

```bash
# Backend
cd backend
npm audit fix
npm update

# Frontend  
cd frontend
npm audit fix
npm update

# Rebuild et redéploiement
./scripts/deploy.sh production
```

## Dépannage

### 1. Problèmes Courants

#### Application Indisponible

```bash
# Vérifier le statut des services
./scripts/monitor.sh status

# Vérifier les logs
./scripts/monitor.sh logs

# Redémarrer les services
docker-compose -f docker-compose.prod.yml restart
```

#### Base de Données Inaccessible

```bash
# Vérifier PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "SELECT version();"

# Vérifier l'espace disque
df -h

# Redémarrer PostgreSQL
docker-compose -f docker-compose.prod.yml restart postgres
```

#### Performance Dégradée

```bash
# Monitoring performance
./scripts/monitor.sh monitor 300

# Vérifier les métriques
curl -s http://localhost/api/health/detailed

# Analyser les logs d'erreur
docker-compose -f docker-compose.prod.yml logs | grep -i error
```

#### Problèmes SSL/HTTPS

```bash
# Vérifier les certificats
openssl x509 -in nginx/ssl/nginx-selfsigned.crt -text -noout

# Renouveler Let's Encrypt
sudo certbot renew

# Redémarrer Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### 2. Diagnostics Avancés

#### Logs Détaillés

```bash
# Activer le mode debug (temporairement)
export NODE_ENV=development
docker-compose -f docker-compose.prod.yml up -d backend

# Voir les logs en temps réel
docker-compose -f docker-compose.prod.yml logs -f backend
```

#### Analyse Performance

```bash
# Top des processus
docker exec cleaning-app-backend-prod top

# Utilisation mémoire
docker exec cleaning-app-backend-prod free -h

# Connexions réseau
docker exec cleaning-app-backend-prod netstat -tlnp
```

### 3. Contacts et Escalade

En cas de problème critique :

1. **Vérification rapide** : `./scripts/monitor.sh check`
2. **Rollback** : `./scripts/deploy.sh rollback` 
3. **Logs d'erreur** : `./scripts/monitor.sh logs backend 100`
4. **Contact équipe** : [Définir vos contacts]

## Rollback

### 1. Rollback Automatique

Le script de déploiement inclut un mécanisme de rollback automatique en cas d'échec :

```bash
# Le rollback se déclenche automatiquement si :
# - Les health checks échouent
# - Le déploiement ne répond pas dans les temps
```

### 2. Rollback Manuel

```bash
# Rollback vers la version précédente
git log --oneline -5  # Voir les commits récents
git checkout <previous-commit-hash>
./scripts/deploy.sh production

# Ou utiliser la fonction rollback
./scripts/deploy.sh rollback
```

### 3. Restauration depuis Sauvegarde

```bash
# Lister les sauvegardes disponibles
ls -la backups/

# Restaurer une sauvegarde spécifique
tar -xzf backups/production_full_20231215_140000.tar.gz
cd production_full_20231215_140000

# Restaurer la base de données
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres < postgres_full_backup.sql

# Redémarrer les services
docker-compose -f docker-compose.prod.yml restart
```

### 4. Plan de Continuité

En cas de panne majeure :

1. **Isolation** : Arrêter le trafic entrant
2. **Diagnostic** : Identifier la cause racine
3. **Décision** : Réparation ou rollback
4. **Exécution** : Appliquer la solution
5. **Vérification** : Tests complets
6. **Communication** : Informer les utilisateurs

---

## Checklist de Déploiement

### Pré-déploiement
- [ ] Secrets configurés et sécurisés
- [ ] DNS configuré correctement
- [ ] Certificats SSL en place
- [ ] Firewall configuré
- [ ] Sauvegarde de l'état actuel
- [ ] Tests en staging validés

### Déploiement
- [ ] Code déployé depuis la branche main
- [ ] Images Docker construites avec succès
- [ ] Services démarrés sans erreur
- [ ] Health checks passent
- [ ] Tests de fumée validés

### Post-déploiement
- [ ] Monitoring opérationnel
- [ ] Logs accessibles
- [ ] Métriques collectées
- [ ] Alertes configurées
- [ ] Documentation mise à jour
- [ ] Équipe informée

---

*Cette documentation doit être maintenue à jour avec chaque modification de l'infrastructure ou de l'application.*