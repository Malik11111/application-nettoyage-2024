# Guide de Sécurité - Cleaning App

## Table des Matières

1. [Vue d'ensemble de la Sécurité](#vue-densemble-de-la-sécurité)
2. [Architecture de Sécurité](#architecture-de-sécurité)
3. [Authentification et Autorisation](#authentification-et-autorisation)
4. [Sécurité des Communications](#sécurité-des-communications)
5. [Protection contre les Attaques](#protection-contre-les-attaques)
6. [Gestion des Secrets](#gestion-des-secrets)
7. [Monitoring de Sécurité](#monitoring-de-sécurité)
8. [Conformité et Audit](#conformité-et-audit)
9. [Procédures d'Incident](#procédures-dincident)
10. [Maintenance de Sécurité](#maintenance-de-sécurité)

## Vue d'ensemble de la Sécurité

### Principes de Sécurité Appliqués

- **Défense en Profondeur** : Plusieurs couches de sécurité
- **Principe du Moindre Privilège** : Accès minimal nécessaire
- **Sécurité par Défaut** : Configuration sécurisée dès l'installation
- **Chiffrement Partout** : Données en transit et au repos
- **Audit et Traçabilité** : Logging complet des activités

### Niveau de Sécurité

- **Classification** : Application d'entreprise avec données personnelles
- **Conformité** : RGPD, SOC 2 Type II (préparation)
- **Certifications** : ISO 27001 (objectif)

## Architecture de Sécurité

### Segmentation Réseau

```
Internet
    │
    ▼
┌─────────────────┐
│   WAF/DDoS      │ ← Protection périmétrique
│   Protection    │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   Load Balancer │ ← Terminaison SSL/TLS
│   (Nginx)       │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   Application   │ ← Réseau privé
│   Tier          │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   Database      │ ← Réseau isolé
│   Tier          │
└─────────────────┘
```

### Zones de Sécurité

1. **Zone DMZ** : Nginx, Load Balancer
2. **Zone Application** : Backend Node.js, Frontend
3. **Zone Données** : PostgreSQL, Redis
4. **Zone Monitoring** : Prometheus, Grafana

### Isolation des Conteneurs

```yaml
# Exemple de configuration sécurisée
services:
  backend:
    # Utilisateur non-root
    user: "1001:1001"
    # Capacités limitées
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    # Système de fichiers en lecture seule
    read_only: true
    # Pas de nouveaux privilèges
    security_opt:
      - no-new-privileges:true
```

## Authentification et Autorisation

### JWT (JSON Web Tokens)

#### Configuration Sécurisée

```typescript
const jwtConfig = {
  algorithm: 'HS256',
  expiresIn: '1h',           // Tokens courte durée
  issuer: 'cleaning-app',
  audience: 'cleaning-app-users',
  notBefore: '0s',
  clockTolerance: '10s'
};

// Refresh token avec durée plus longue
const refreshTokenConfig = {
  expiresIn: '7d',
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
};
```

#### Rotation des Tokens

```typescript
// Implémentation de la rotation automatique
app.use('/api/auth/refresh', (req, res) => {
  // Valider le refresh token
  // Générer un nouveau access token
  // Optionnellement générer un nouveau refresh token
  // Invalider l'ancien refresh token
});
```

### Gestion des Sessions

```typescript
const sessionConfig = {
  name: 'sessionId',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60, // 1 heure
    sameSite: 'strict'
  }
};
```

### Contrôle d'Accès Basé sur les Rôles (RBAC)

```typescript
enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  VIEWER = 'viewer'
}

const permissions = {
  [UserRole.ADMIN]: ['*'],
  [UserRole.MANAGER]: ['users:read', 'users:write', 'tasks:*', 'locations:*'],
  [UserRole.EMPLOYEE]: ['tasks:read', 'tasks:write', 'profile:write'],
  [UserRole.VIEWER]: ['tasks:read', 'locations:read', 'dashboard:read']
};
```

## Sécurité des Communications

### Configuration TLS/SSL

#### Nginx Configuration

```nginx
# Protocoles TLS modernes uniquement
ssl_protocols TLSv1.2 TLSv1.3;

# Chiffrements forts uniquement
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

# Préférence serveur pour les chiffrements
ssl_prefer_server_ciphers off;

# HSTS (HTTP Strict Transport Security)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Configuration OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /path/to/chain.pem;

# Session SSL
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;
```

#### Configuration des Headers de Sécurité

```nginx
# Protection contre le clickjacking
add_header X-Frame-Options "DENY" always;

# Protection contre le sniffing MIME
add_header X-Content-Type-Options "nosniff" always;

# Protection XSS
add_header X-XSS-Protection "1; mode=block" always;

# Politique de référent
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';" always;

# Permissions Policy
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

### Chiffrement des Données

#### En Transit
- **TLS 1.2+** pour toutes les communications externes
- **mTLS** pour les communications inter-services (optionnel)
- **VPN** pour les accès administratifs

#### Au Repos
```sql
-- Chiffrement transparent des données (TDE)
-- Configuration PostgreSQL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = 'server.crt';
ALTER SYSTEM SET ssl_key_file = 'server.key';

-- Chiffrement au niveau colonne pour les données sensibles
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Exemple de chiffrement de champ
INSERT INTO users (email, encrypted_ssn) 
VALUES ('user@example.com', crypt('123-45-6789', gen_salt('bf')));
```

## Protection contre les Attaques

### Rate Limiting

#### Configuration Multi-niveau

```typescript
// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requêtes par fenêtre
  message: 'Trop de requêtes, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting pour l'authentification
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 tentatives par heure
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.ip + ':' + req.body.email
});

// Rate limiting adaptatif
const adaptiveLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 100,
  delayMs: 500,
  maxDelayMs: 20000
});
```

#### Configuration Nginx

```nginx
# Limitation de taux au niveau Nginx
http {
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=global:10m rate=100r/s;
    
    server {
        # Limitation globale
        limit_req zone=global burst=200 nodelay;
        
        location /api/auth/ {
            limit_req zone=auth burst=10 nodelay;
        }
        
        location /api/ {
            limit_req zone=api burst=50 nodelay;
        }
    }
}
```

### Protection CSRF

```typescript
import csrf from 'csurf';

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

app.use('/api', csrfProtection);
```

### Protection contre les Injections

#### SQL Injection Prevention

```typescript
// Utilisation de Prisma ORM pour la protection automatique
const user = await prisma.user.findFirst({
  where: {
    email: userEmail, // Automatiquement échappé par Prisma
  }
});

// Pour les requêtes SQL brutes, utiliser des paramètres
const result = await prisma.$queryRaw`
  SELECT * FROM users 
  WHERE email = ${userEmail} 
  AND created_at > ${dateThreshold}
`;
```

#### NoSQL Injection Prevention

```typescript
// Validation et sanitisation des entrées
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).regex(/^[a-zA-Z\s]+$/),
  age: z.number().min(18).max(120)
});

app.post('/api/users', (req, res) => {
  try {
    const validatedData = userSchema.parse(req.body);
    // Utiliser validatedData
  } catch (error) {
    res.status(400).json({ error: 'Données invalides' });
  }
});
```

### Protection XSS

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitisation côté client
const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
};

// Sanitisation côté serveur
import xss from 'xss';

const cleanInput = xss(userInput, {
  whiteList: {}, // Aucune balise autorisée
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script']
});
```

## Gestion des Secrets

### Docker Secrets

```yaml
# docker-compose.prod.yml
secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt

services:
  backend:
    secrets:
      - db_password
      - jwt_secret
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password
      JWT_SECRET_FILE: /run/secrets/jwt_secret
```

### Rotation des Secrets

```bash
#!/bin/bash
# Script de rotation des secrets

rotate_secret() {
    local secret_name=$1
    local new_value=$2
    
    # Sauvegarder l'ancien secret
    cp "secrets/${secret_name}.txt" "secrets/${secret_name}.old"
    
    # Écrire le nouveau secret
    echo "$new_value" > "secrets/${secret_name}.txt"
    
    # Redémarrer les services concernés
    docker-compose -f docker-compose.prod.yml restart backend
    
    # Vérifier que tout fonctionne
    if ./scripts/monitor.sh check; then
        echo "Rotation de $secret_name réussie"
        rm "secrets/${secret_name}.old"
    else
        echo "Échec de la rotation, restauration"
        mv "secrets/${secret_name}.old" "secrets/${secret_name}.txt"
        docker-compose -f docker-compose.prod.yml restart backend
    fi
}
```

### Audit des Secrets

```bash
# Vérification des permissions
find secrets/ -type f ! -perm 600 -exec echo "Permissions incorrectes: {}" \;

# Vérification de l'âge des secrets
find secrets/ -type f -mtime +90 -exec echo "Secret ancien (>90 jours): {}" \;

# Détection de secrets dans les logs
grep -r "password\|secret\|key" /var/log/ | grep -v "password_file\|secret_file"
```

## Monitoring de Sécurité

### Métriques de Sécurité

```typescript
// Collecte de métriques de sécurité
const securityMetrics = {
  // Tentatives d'authentification
  auth_attempts_total: new Counter({
    name: 'auth_attempts_total',
    help: 'Total authentication attempts',
    labelNames: ['status', 'ip', 'user_agent']
  }),
  
  // Violations de rate limiting
  rate_limit_violations_total: new Counter({
    name: 'rate_limit_violations_total',
    help: 'Total rate limit violations',
    labelNames: ['endpoint', 'ip']
  }),
  
  // Tentatives d'accès non autorisé
  unauthorized_access_attempts_total: new Counter({
    name: 'unauthorized_access_attempts_total',
    help: 'Total unauthorized access attempts',
    labelNames: ['resource', 'ip', 'user_id']
  })
};
```

### Alertes de Sécurité

```yaml
# Prometheus rules
groups:
  - name: security_alerts
    rules:
      - alert: HighAuthFailureRate
        expr: rate(auth_attempts_total{status="failed"}[5m]) > 0.5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Taux d'échec d'authentification élevé"
          
      - alert: SuspiciousActivity
        expr: rate(unauthorized_access_attempts_total[5m]) > 1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Activité suspecte détectée"
          
      - alert: RateLimitingBypass
        expr: rate(rate_limit_violations_total[5m]) > 10
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Tentatives de contournement de rate limiting"
```

### Logging de Sécurité

```typescript
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: '/var/log/security/security.log',
      level: 'info'
    }),
    new winston.transports.File({ 
      filename: '/var/log/security/security-error.log',
      level: 'error'
    })
  ]
});

// Événements à logger
const logSecurityEvent = (event: string, details: any) => {
  securityLogger.info({
    event,
    timestamp: new Date().toISOString(),
    ip: details.ip,
    user_id: details.user_id,
    user_agent: details.user_agent,
    details
  });
};

// Exemples d'utilisation
logSecurityEvent('AUTH_ATTEMPT', { status: 'failed', email: 'user@example.com' });
logSecurityEvent('UNAUTHORIZED_ACCESS', { resource: '/admin', method: 'GET' });
logSecurityEvent('RATE_LIMIT_VIOLATION', { endpoint: '/api/users', count: 150 });
```

## Conformité et Audit

### RGPD (GDPR) Compliance

#### Consentement et Traitement

```typescript
// Modèle de consentement
interface UserConsent {
  user_id: string;
  consent_date: Date;
  consent_version: string;
  purposes: {
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
  };
  legal_basis: 'consent' | 'contract' | 'legitimate_interest';
}

// Droit à l'oubli
const deleteUserData = async (userId: string) => {
  // Supprimer ou anonymiser toutes les données personnelles
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted-${userId}@example.com`,
      name: 'Utilisateur supprimé',
      phone: null,
      // Conserver les données nécessaires pour l'audit
      deletion_date: new Date(),
      deletion_reason: 'user_request'
    }
  });
};

// Export des données (portabilité)
const exportUserData = async (userId: string) => {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tasks: true,
      locations: true,
      // Inclure toutes les données personnelles
    }
  });
  
  return {
    personal_data: userData,
    export_date: new Date().toISOString(),
    format: 'JSON'
  };
};
```

#### Audit Trail

```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  user_id?: string;
  action: string;
  resource: string;
  old_values?: any;
  new_values?: any;
  ip_address: string;
  user_agent: string;
  session_id?: string;
}

const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.json;
  
  res.json = function(body) {
    // Logger l'action
    auditLogger.info({
      timestamp: new Date(),
      user_id: req.user?.id,
      action: `${req.method} ${req.path}`,
      resource: req.path,
      request_body: req.body,
      response_status: res.statusCode,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
    
    return originalSend.call(this, body);
  };
  
  next();
};
```

### Certification SOC 2

#### Contrôles de Sécurité

```bash
# Script de vérification des contrôles
#!/bin/bash

check_security_controls() {
    echo "Vérification des contrôles SOC 2..."
    
    # CC6.1 - Accès logiques
    echo "✓ Vérification des politiques d'accès"
    
    # CC6.2 - Authentification
    echo "✓ Vérification de l'authentification forte"
    
    # CC6.3 - Autorisation
    echo "✓ Vérification des autorisations RBAC"
    
    # CC6.6 - Chiffrement
    echo "✓ Vérification du chiffrement TLS"
    
    # CC7.1 - Détection des menaces
    echo "✓ Vérification du monitoring de sécurité"
}
```

## Procédures d'Incident

### Classification des Incidents

1. **Critique (P1)** : Compromission de données, service indisponible
2. **Élevé (P2)** : Vulnérabilité exploitable, performance dégradée  
3. **Moyen (P3)** : Problème de sécurité mineur
4. **Faible (P4)** : Amélioration de sécurité

### Procédure de Réponse

```bash
#!/bin/bash
# Script de réponse aux incidents de sécurité

security_incident_response() {
    local incident_type=$1
    local severity=$2
    
    echo "INCIDENT DE SÉCURITÉ DÉTECTÉ - Type: $incident_type, Sévérité: $severity"
    
    # 1. Confinement immédiat
    if [[ "$severity" == "P1" ]]; then
        echo "Isolement du système..."
        # Bloquer le trafic suspect
        iptables -I INPUT -s $suspicious_ip -j DROP
        
        # Sauvegarder les preuves
        ./scripts/backup.sh production full
        
        # Notification immédiate
        send_alert "INCIDENT CRITIQUE" "Système isolé, investigation en cours"
    fi
    
    # 2. Évaluation
    echo "Collecte des preuves..."
    ./scripts/monitor.sh logs > "incident_logs_$(date +%Y%m%d_%H%M%S).txt"
    
    # 3. Éradication
    case $incident_type in
        "malware")
            echo "Suppression du malware..."
            ;;
        "breach")
            echo "Colmatage de la brèche..."
            ;;
        "ddos")
            echo "Mitigation DDoS..."
            ;;
    esac
    
    # 4. Récupération
    echo "Restauration des services..."
    ./scripts/deploy.sh production
    
    # 5. Leçons apprises
    echo "Documentation de l'incident..."
}
```

### Communication de Crise

```typescript
// Notification automatique des incidents
const notifySecurityTeam = async (incident: SecurityIncident) => {
  const message = {
    severity: incident.severity,
    type: incident.type,
    timestamp: incident.timestamp,
    affected_systems: incident.affected_systems,
    initial_assessment: incident.description
  };
  
  // Notification Slack/Teams
  await sendSlackAlert(message);
  
  // Email d'urgence
  if (incident.severity === 'P1') {
    await sendEmailAlert('security@company.com', message);
  }
  
  // SMS pour les incidents critiques
  if (incident.severity === 'P1') {
    await sendSMSAlert('+1234567890', `INCIDENT CRITIQUE: ${incident.type}`);
  }
};
```

## Maintenance de Sécurité

### Cycle de Mise à Jour

```bash
#!/bin/bash
# Script de maintenance de sécurité hebdomadaire

weekly_security_maintenance() {
    echo "Maintenance de sécurité hebdomadaire..."
    
    # 1. Mise à jour des dépendances
    echo "Mise à jour des dépendances..."
    cd backend && npm audit fix
    cd frontend && npm audit fix
    
    # 2. Scan de vulnérabilités
    echo "Scan de vulnérabilités..."
    docker run --rm -v $(pwd):/app securecodewarrior/docker-security-scan /app
    
    # 3. Vérification des certificats
    echo "Vérification des certificats SSL..."
    openssl x509 -in nginx/ssl/cert.pem -noout -enddate
    
    # 4. Rotation des logs
    echo "Rotation des logs de sécurité..."
    logrotate /etc/logrotate.d/security
    
    # 5. Test des sauvegardes
    echo "Test de restauration de sauvegarde..."
    ./scripts/test-backup.sh
    
    # 6. Mise à jour des règles de sécurité
    echo "Mise à jour des règles WAF..."
    # Mettre à jour les règles de sécurité
    
    echo "Maintenance terminée"
}
```

### Tests de Pénétration

```bash
#!/bin/bash
# Script de test de pénétration automatisé

automated_pentest() {
    echo "Démarrage des tests de pénétration..."
    
    # 1. Scan de ports
    nmap -sS -O target.example.com
    
    # 2. Test d'injection SQL
    sqlmap -u "http://target.example.com/api/users" --batch
    
    # 3. Test XSS
    # Utiliser des outils comme ZAP ou Burp Suite
    
    # 4. Test de force brute
    hydra -l admin -P passwords.txt target.example.com http-post-form
    
    # 5. Génération du rapport
    generate_pentest_report
}
```

---

## Checklist de Sécurité

### Déploiement
- [ ] Secrets correctement configurés et sécurisés
- [ ] TLS/SSL configuré avec certificats valides
- [ ] Rate limiting activé sur tous les endpoints
- [ ] Headers de sécurité configurés
- [ ] Firewall configuré avec règles restrictives
- [ ] Monitoring de sécurité opérationnel
- [ ] Logs de sécurité configurés et centralisés
- [ ] Tests de pénétration effectués

### Opérationnel
- [ ] Rotation des secrets planifiée
- [ ] Sauvegardes chiffrées et testées
- [ ] Mises à jour de sécurité appliquées
- [ ] Audit des accès effectué
- [ ] Formation sécurité de l'équipe
- [ ] Procédures d'incident documentées
- [ ] Contacts d'urgence à jour

### Conformité
- [ ] Politique de confidentialité mise à jour
- [ ] Consentements RGPD collectés
- [ ] Audit trail complet
- [ ] Documentation de sécurité à jour
- [ ] Évaluation des risques effectuée
- [ ] Certification de sécurité valide

---

*Ce document doit être revu et mis à jour régulièrement selon l'évolution des menaces et des réglementations.*