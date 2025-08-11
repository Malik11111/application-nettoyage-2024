# Cleaning App - Configuration DevOps Complète

## 🚀 Vue d'ensemble

Cette configuration DevOps transforme l'application de gestion des agents d'entretien en une solution prête pour la production avec :

- **Sécurité renforcée** : Rate limiting, CORS, headers de sécurité, secrets management
- **Monitoring complet** : Prometheus, Grafana, Loki, métriques business et techniques
- **CI/CD automatisé** : GitHub Actions avec tests, sécurité et déploiement
- **Architecture scalable** : Multi-conteneurs avec load balancing et cache Redis
- **Haute disponibilité** : Health checks, auto-restart, rollback automatique

## 📋 Quick Start

### 1. Configuration Initiale

```bash
# Cloner le projet
git clone <votre-repository>
cd cleaning-app

# Configurer les secrets
./scripts/setup-secrets.sh

# Vérifier la configuration
./scripts/monitor.sh check
```

### 2. Déploiement Staging

```bash
# Déploiement en environnement de test
./scripts/deploy.sh staging

# Vérification
curl -f http://localhost/api/health
```

### 3. Déploiement Production

```bash
# Déploiement en production
./scripts/deploy.sh production

# Monitoring
./scripts/monitor.sh status
```

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Load Balancer │────▶│   Frontend      │────▶│   Backend       │
│   (Nginx SSL)   │     │   (React/Nginx) │     │   (Node.js)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Monitoring    │     │   Database      │     │   Cache         │
│ (Grafana/Prom.) │     │   (PostgreSQL)  │     │   (Redis)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 🛠️ Composants Implémentés

### Containerisation

- ✅ **Dockerfiles multi-stage** optimisés pour la production
- ✅ **Images légères** avec utilisateurs non-root
- ✅ **Health checks** intégrés dans tous les services
- ✅ **Secrets management** avec Docker secrets

### Reverse Proxy & Load Balancing

- ✅ **Nginx** avec configuration SSL/TLS moderne
- ✅ **Rate limiting** multi-niveau (global, API, auth)
- ✅ **Compression Gzip** et optimisations performance
- ✅ **Headers de sécurité** complets

### Monitoring & Observabilité

- ✅ **Prometheus** : Collection de métriques
- ✅ **Grafana** : Visualisation et dashboards
- ✅ **Loki/Promtail** : Agrégation de logs
- ✅ **Alertes** : Email, Slack, PagerDuty
- ✅ **SLI/SLO** : Monitoring de la qualité de service

### Sécurité

- ✅ **Authentification JWT** sécurisée
- ✅ **RBAC** : Contrôle d'accès basé sur les rôles
- ✅ **Rate limiting** adaptatif
- ✅ **CORS** configuré pour la production
- ✅ **Headers CSP** et sécurité moderne
- ✅ **Audit logging** complet

### CI/CD Pipeline

- ✅ **GitHub Actions** : Tests automatisés
- ✅ **Security scanning** : Trivy, Audit npm
- ✅ **Multi-stage deployment** : Staging → Production
- ✅ **Rollback automatique** en cas d'échec
- ✅ **Dependency updates** automatisés

## 📁 Structure des Fichiers

```
cleaning-app/
├── .github/workflows/          # CI/CD GitHub Actions
│   ├── ci-cd.yml              # Pipeline principal
│   ├── dependency-update.yml   # Mises à jour automatiques
│   └── security-scan.yml       # Scans de sécurité
├── backend/
│   ├── src/middleware/         # Middlewares de sécurité et métriques
│   ├── src/routes/health.ts    # Endpoints de santé
│   └── Dockerfile             # Image backend optimisée
├── frontend/
│   ├── nginx.conf             # Configuration Nginx frontend
│   └── Dockerfile             # Image frontend multi-stage
├── nginx/                     # Reverse proxy
│   ├── conf.d/app.conf        # Configuration application
│   ├── nginx.conf             # Configuration principale
│   └── ssl/                   # Certificats SSL
├── monitoring/                # Stack de monitoring
│   ├── prometheus/            # Configuration Prometheus
│   ├── grafana/              # Dashboards et datasources
│   ├── loki/                 # Configuration Loki
│   └── promtail/             # Configuration Promtail
├── scripts/                   # Scripts d'automatisation
│   ├── deploy.sh             # Script de déploiement
│   ├── setup-secrets.sh      # Configuration des secrets
│   ├── backup.sh             # Sauvegarde automatisée
│   ├── monitor.sh            # Monitoring et diagnostics
│   └── init-db.sh            # Initialisation base de données
├── secrets/                   # Secrets (gitignored)
│   ├── postgres_password.txt
│   ├── jwt_secret.txt
│   └── ...
├── docker-compose.prod.yml    # Configuration production
├── DEPLOYMENT.md             # Guide de déploiement
├── SECURITY.md               # Guide de sécurité
├── MONITORING.md             # Guide de monitoring
└── README-DEVOPS.md          # Ce fichier
```

## 🔧 Configuration

### Variables d'Environnement

```bash
# Production
NODE_ENV=production
DATABASE_URL_FILE=/run/secrets/database_url
JWT_SECRET_FILE=/run/secrets/jwt_secret
REDIS_URL_FILE=/run/secrets/redis_url

# Monitoring
GRAFANA_ADMIN_PASSWORD_FILE=/run/secrets/grafana_admin_password
PROMETHEUS_RETENTION_TIME=15d

# Sécurité
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Endpoints Ajoutés

```typescript
// Health Checks
GET /api/health              // Santé simple
GET /api/health/detailed     // Santé détaillée avec métriques
GET /api/ready               // Readiness probe K8s
GET /api/live                // Liveness probe K8s

// Métriques
GET /api/metrics            // Métriques Prometheus
GET /metrics                // Métriques système (nginx)

// Sécurité
POST /api/auth/*            // Rate limited à 10/heure
GET|POST /api/*            // Rate limited à 100/minute
```

## 📊 Monitoring

### Dashboards Grafana

1. **Application Overview**
   - Request rate, error rate, response time
   - Active users, tasks status
   - Database connections

2. **System Resources**
   - CPU, mémoire, disque, réseau
   - Conteneurs Docker stats
   - Performance I/O

3. **Security Dashboard**
   - Failed authentications
   - Rate limiting violations
   - Suspicious activities

4. **SLO Dashboard**
   - Availability: 99.9%
   - Error rate: < 1%
   - Response time P95: < 1s

### Alertes Configurées

- 🔴 **Critiques** : Service down, error rate > 5%
- 🟡 **Warnings** : High CPU/memory, slow response
- 🔵 **Info** : Deployment, backup completed

## 🔐 Sécurité

### Mesures Implémentées

- **Authentification** : JWT avec rotation automatique
- **Autorisation** : RBAC avec 4 niveaux (admin, manager, employee, viewer)
- **Rate Limiting** : 3 niveaux (global, API, auth)
- **HTTPS** : TLS 1.2+, HSTS, certificats Let's Encrypt
- **Headers** : CSP, XSS Protection, CSRF tokens
- **Audit** : Logging complet des activités
- **Secrets** : Docker secrets, rotation automatique

### Conformité

- ✅ **RGPD** : Consentement, droit à l'oubli, portabilité
- ✅ **SOC 2** : Contrôles de sécurité, audit trail
- ✅ **ISO 27001** : Gestion des risques, documentation

## 🚀 CI/CD

### Pipeline Automatisé

1. **Tests** : Unit tests, integration tests, linting
2. **Sécurité** : Vulnerability scanning, dependency audit
3. **Build** : Multi-arch Docker images (amd64, arm64)
4. **Deploy** : Staging automatique, production avec approbation
5. **Monitoring** : Health checks, smoke tests post-deploy

### Environments

- **Staging** : Auto-deploy sur `develop` branch
- **Production** : Auto-deploy sur `main` branch avec approbation
- **Rollback** : Automatique en cas d'échec des health checks

## 🛠️ Commandes Utiles

```bash
# Déploiement
./scripts/deploy.sh production              # Déployer en production
./scripts/deploy.sh rollback               # Rollback d'urgence

# Monitoring
./scripts/monitor.sh check                 # Health check rapide
./scripts/monitor.sh status                # Status détaillé
./scripts/monitor.sh logs backend 100     # Logs backend
./scripts/monitor.sh alerts               # Vérifier les alertes

# Maintenance
./scripts/backup.sh production full       # Sauvegarde complète
./scripts/setup-secrets.sh               # Regénérer les secrets
docker-compose -f docker-compose.prod.yml ps # Status conteneurs
```

## 📈 Métriques Business

### KPIs Trackés

- **Utilisateurs actifs** : Connexions par heure/jour
- **Tâches** : Créées, complétées, en cours par statut
- **Performance** : Temps de traitement moyen
- **Erreurs** : Taux d'erreur par endpoint
- **Disponibilité** : Uptime, SLA compliance

### Dashboards Business

- Utilisation de l'application
- Productivité des équipes
- Tendances temporelles
- Alertes métier

## 🔧 Maintenance

### Tâches Automatisées

- **Quotidienne** : Sauvegarde complète, nettoyage logs
- **Hebdomadaire** : Mise à jour sécurité, scan vulnérabilités
- **Mensuelle** : Rotation secrets, archivage logs
- **Trimestrielle** : Audit sécurité, optimisation performance

### Maintenance Manuelle

```bash
# Mise à jour application
git pull origin main && ./scripts/deploy.sh production

# Nettoyage système
docker system prune -f && docker volume prune -f

# Check sécurité
./scripts/monitor.sh alerts && npm audit

# Performance tuning
docker stats && ./scripts/monitor.sh monitor 300
```

## 📞 Support & Troubleshooting

### Contacts Escalade

1. **L1 Support** : Monitoring automatique, self-healing
2. **L2 DevOps** : Incidents majeurs, déploiements
3. **L3 Engineering** : Bugs critiques, architecture

### Runbooks

- [DEPLOYMENT.md](./DEPLOYMENT.md) : Guide de déploiement complet
- [SECURITY.md](./SECURITY.md) : Procédures de sécurité
- [MONITORING.md](./MONITORING.md) : Configuration monitoring

### Outils Debug

```bash
# Logs en temps réel
./scripts/monitor.sh logs

# Performance analysis
./scripts/monitor.sh monitor 300

# Database debug
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres

# Network debug
docker network ls && docker network inspect cleaning-app_app-network
```

## 🎯 Prochaines Étapes

### Améliorations Futures

- [ ] **Kubernetes** : Migration vers K8s pour scalabilité
- [ ] **Multi-région** : Déploiement géo-distribué
- [ ] **A/B Testing** : Feature flags et expérimentation
- [ ] **Machine Learning** : Prédictions et optimisations
- [ ] **Mobile API** : Extension pour applications mobiles

### Optimisations

- [ ] **CDN** : Distribution de contenu global
- [ ] **Caching** : Redis clusters, cache distribué
- [ ] **Database** : Read replicas, partitioning
- [ ] **Monitoring** : APM, distributed tracing
- [ ] **Security** : WAF, DDoS protection

---

## ✅ Checklist de Validation

### Infrastructure
- [ ] Tous les conteneurs démarrent sans erreur
- [ ] Health checks passent (API, database, cache)
- [ ] HTTPS fonctionnel avec certificats valides
- [ ] Rate limiting opérationnel
- [ ] Monitoring collecte les métriques

### Sécurité
- [ ] Authentification JWT fonctionnelle
- [ ] RBAC correctement configuré
- [ ] Headers de sécurité présents
- [ ] Secrets correctement montés
- [ ] Logs d'audit activés

### Performance
- [ ] Temps de réponse < 1s (P95)
- [ ] Taux d'erreur < 1%
- [ ] Disponibilité > 99.9%
- [ ] Utilisation ressources < 80%
- [ ] Cache Redis opérationnel

### Monitoring
- [ ] Dashboards Grafana accessibles
- [ ] Alertes configurées et testées
- [ ] Logs centralisés dans Loki
- [ ] Métriques Prometheus collectées
- [ ] Notifications fonctionnelles

---

**🎉 Félicitations ! Votre application est maintenant prête pour la production avec une configuration DevOps complète et professionnelle.**

*Pour toute question ou support, référez-vous aux guides détaillés dans les fichiers DEPLOYMENT.md, SECURITY.md et MONITORING.md.*