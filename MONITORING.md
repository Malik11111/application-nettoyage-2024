# Guide de Monitoring - Cleaning App

## Table des Matières

1. [Architecture de Monitoring](#architecture-de-monitoring)
2. [Métriques Collectées](#métriques-collectées)
3. [Configuration Prometheus](#configuration-prometheus)
4. [Dashboards Grafana](#dashboards-grafana)
5. [Gestion des Logs](#gestion-des-logs)
6. [Alertes et Notifications](#alertes-et-notifications)
7. [Surveillance de Performance](#surveillance-de-performance)
8. [Monitoring de Sécurité](#monitoring-de-sécurité)
9. [Maintenance et Optimisation](#maintenance-et-optimisation)
10. [Troubleshooting](#troubleshooting)

## Architecture de Monitoring

### Stack de Monitoring

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│   Prometheus    │───▶│   Grafana       │
│   (Metrics)     │    │   (Collection)  │    │   (Visualisation)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Logs          │───▶│   Loki          │───▶│   Grafana       │
│   (Application) │    │   (Aggregation) │    │   (Log Explorer)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Promtail      │
│   (Log Shipping)│
└─────────────────┘
```

### Composants

1. **Prometheus** : Collecte et stockage des métriques
2. **Grafana** : Visualisation et dashboards
3. **Loki** : Agrégation et indexation des logs
4. **Promtail** : Agent de collecte des logs
5. **AlertManager** : Gestion des alertes
6. **Node Exporter** : Métriques système
7. **cAdvisor** : Métriques des conteneurs

## Métriques Collectées

### Métriques Application

```typescript
// backend/src/middleware/metrics.ts

// Métriques HTTP
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// Métriques métier
const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Number of active users',
});

const tasksTotal = new Gauge({
  name: 'tasks_total',
  help: 'Total number of tasks',
  labelNames: ['status']
});

const databaseConnections = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
});
```

### Métriques Système

```yaml
# Métriques collectées par Node Exporter
system_metrics:
  - node_cpu_seconds_total      # Utilisation CPU
  - node_memory_MemAvailable_bytes  # Mémoire disponible
  - node_disk_read_bytes_total  # I/O disque lecture
  - node_disk_write_bytes_total # I/O disque écriture
  - node_network_receive_bytes_total # Réseau entrant
  - node_network_transmit_bytes_total # Réseau sortant
  - node_filesystem_size_bytes  # Taille du système de fichiers
  - node_filesystem_avail_bytes # Espace disque disponible
```

### Métriques Conteneurs

```yaml
# Métriques collectées par cAdvisor
container_metrics:
  - container_cpu_usage_seconds_total    # CPU utilisé par conteneur
  - container_memory_usage_bytes         # Mémoire utilisée
  - container_memory_max_usage_bytes     # Pic de mémoire
  - container_network_receive_bytes_total # Trafic réseau entrant
  - container_network_transmit_bytes_total # Trafic réseau sortant
  - container_fs_reads_total             # Opérations lecture disque
  - container_fs_writes_total            # Opérations écriture disque
```

## Configuration Prometheus

### Règles d'Alerte

```yaml
# monitoring/prometheus/alert_rules.yml
groups:
  - name: application_alerts
    rules:
      # Taux d'erreur élevé
      - alert: HighErrorRate
        expr: |
          (
            rate(http_requests_total{status_code=~"5.."}[5m]) /
            rate(http_requests_total[5m])
          ) > 0.05
        for: 2m
        labels:
          severity: critical
          service: backend
        annotations:
          summary: "Taux d'erreur élevé détecté"
          description: "Le taux d'erreur est de {{ $value | humanizePercentage }} pour {{ $labels.instance }}"

      # Temps de réponse élevé
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 2
        for: 5m
        labels:
          severity: warning
          service: backend
        annotations:
          summary: "Temps de réponse élevé"
          description: "Le P95 des temps de réponse est de {{ $value }}s"

      # Base de données inaccessible
      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
          service: database
        annotations:
          summary: "Base de données inaccessible"
          description: "PostgreSQL est indisponible depuis plus d'1 minute"

      # Utilisation mémoire élevée
      - alert: HighMemoryUsage
        expr: |
          (
            node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes
          ) / node_memory_MemTotal_bytes > 0.85
        for: 5m
        labels:
          severity: warning
          service: system
        annotations:
          summary: "Utilisation mémoire élevée"
          description: "L'utilisation mémoire est à {{ $value | humanizePercentage }}"

      # Espace disque faible
      - alert: LowDiskSpace
        expr: |
          (
            node_filesystem_avail_bytes{mountpoint="/"} /
            node_filesystem_size_bytes{mountpoint="/"}
          ) < 0.1
        for: 2m
        labels:
          severity: critical
          service: system
        annotations:
          summary: "Espace disque faible"
          description: "Il reste {{ $value | humanizePercentage }} d'espace disque"
```

### Configuration Recording Rules

```yaml
# monitoring/prometheus/recording_rules.yml
groups:
  - name: application_rules
    interval: 30s
    rules:
      # Taux d'erreur par service
      - record: app:error_rate
        expr: |
          rate(http_requests_total{status_code=~"5.."}[5m]) /
          rate(http_requests_total[5m])

      # Throughput par service
      - record: app:request_rate
        expr: rate(http_requests_total[5m])

      # P95 temps de réponse
      - record: app:response_time_p95
        expr: |
          histogram_quantile(0.95,
            rate(http_request_duration_seconds_bucket[5m])
          )

      # Utilisation CPU moyenne
      - record: node:cpu_utilization
        expr: |
          100 - (
            avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100
          )

      # Utilisation mémoire
      - record: node:memory_utilization
        expr: |
          (
            node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes
          ) / node_memory_MemTotal_bytes
```

## Dashboards Grafana

### Dashboard Application Overview

```json
{
  "dashboard": {
    "id": 1,
    "title": "Cleaning App - Application Overview",
    "tags": ["cleaning-app", "overview"],
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m]))",
            "legendFormat": "Requests/sec"
          }
        ]
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status_code=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))",
            "legendFormat": "Error Rate"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percentunit",
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 0.01},
                {"color": "red", "value": 0.05}
              ]
            }
          }
        }
      },
      {
        "id": 3,
        "title": "Response Time P95",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P95"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 1},
                {"color": "red", "value": 2}
              ]
            }
          }
        }
      }
    ]
  }
}
```

### Dashboard System Resources

```json
{
  "dashboard": {
    "title": "System Resources",
    "panels": [
      {
        "title": "CPU Usage",
        "type": "timeseries",
        "targets": [
          {
            "expr": "100 - (avg(irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "timeseries",
        "targets": [
          {
            "expr": "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100",
            "legendFormat": "Memory Usage %"
          }
        ]
      },
      {
        "title": "Disk I/O",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(node_disk_read_bytes_total[5m])",
            "legendFormat": "Read"
          },
          {
            "expr": "rate(node_disk_written_bytes_total[5m])",
            "legendFormat": "Write"
          }
        ]
      }
    ]
  }
}
```

### Dashboard Business Metrics

```json
{
  "dashboard": {
    "title": "Business Metrics",
    "panels": [
      {
        "title": "Active Users",
        "type": "stat",
        "targets": [
          {
            "expr": "active_users_total",
            "legendFormat": "Active Users"
          }
        ]
      },
      {
        "title": "Tasks by Status",
        "type": "piechart",
        "targets": [
          {
            "expr": "tasks_total",
            "legendFormat": "{{status}}"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "timeseries",
        "targets": [
          {
            "expr": "database_connections_active",
            "legendFormat": "Active Connections"
          }
        ]
      }
    ]
  }
}
```

## Gestion des Logs

### Configuration Loki

```yaml
# monitoring/loki/loki-config.yml
auth_enabled: false

server:
  http_listen_port: 3100
  log_level: info

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
  - from: 2020-10-24
    store: boltdb-shipper
    object_store: filesystem
    schema: v11
    index:
      prefix: index_
      period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /tmp/loki/index
    cache_location: /tmp/loki/index_cache
    shared_store: filesystem
  filesystem:
    directory: /tmp/loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
  max_query_length: 12000h
  max_query_parallelism: 16
  max_streams_per_user: 10000
  max_global_streams_per_user: 5000

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: true
  retention_period: 2160h  # 90 jours
```

### Configuration Promtail

```yaml
# monitoring/promtail/promtail-config.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # Logs application backend
  - job_name: backend
    static_configs:
      - targets:
          - localhost
        labels:
          job: backend
          __path__: /var/log/backend/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            message: message
            timestamp: timestamp
            module: module
            request_id: request_id
      - labels:
          level:
          module:
      - timestamp:
          source: timestamp
          format: RFC3339
      - output:
          source: message

  # Logs Nginx
  - job_name: nginx-access
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx-access
          __path__: /var/log/nginx/access.log
    pipeline_stages:
      - regex:
          expression: '^(?P<remote_addr>\S+) - (?P<remote_user>\S+) \[(?P<time_local>[^\]]+)\] "(?P<method>\S+) (?P<path>\S+) (?P<protocol>\S+)" (?P<status>\d+) (?P<body_bytes_sent>\d+) "(?P<http_referer>[^"]*)" "(?P<http_user_agent>[^"]*)"'
      - labels:
          method:
          status:
          path:
      - timestamp:
          source: time_local
          format: '02/Jan/2006:15:04:05 -0700'

  # Logs d'erreur Nginx
  - job_name: nginx-error
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx-error
          __path__: /var/log/nginx/error.log
    pipeline_stages:
      - regex:
          expression: '^(?P<timestamp>\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}) \[(?P<level>\w+)\] (?P<message>.*)'
      - labels:
          level:
      - timestamp:
          source: timestamp
          format: '2006/01/02 15:04:05'
```

### Requêtes LogQL Utiles

```logql
# Erreurs de l'application dans les dernières 5 minutes
{job="backend"} |= "ERROR" | json | line_format "{{.timestamp}} {{.level}} {{.message}}"

# Requêtes API avec temps de réponse > 1s
{job="nginx-access"} | logfmt | duration > 1s | line_format "{{.method}} {{.path}} {{.duration}}"

# Top 10 des erreurs
topk(10, sum by (message) (count_over_time({job="backend"} |= "ERROR" [1h])))

# Taux d'erreur par minute
rate({job="backend"} |= "ERROR" [1m])

# Distribution des codes de statut HTTP
sum by (status) (count_over_time({job="nginx-access"} [1h]))
```

## Alertes et Notifications

### Configuration AlertManager

```yaml
# monitoring/alertmanager/config.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@cleaning-app.com'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  receiver: 'default'
  routes:
  - match:
      severity: critical
    receiver: 'critical-alerts'
  - match:
      service: database
    receiver: 'database-team'

receivers:
- name: 'default'
  email_configs:
  - to: 'devops@cleaning-app.com'
    subject: '[{{ .Status }}] {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      Labels: {{ range .Labels.SortedPairs }}{{ .Name }}={{ .Value }} {{ end }}
      {{ end }}

- name: 'critical-alerts'
  email_configs:
  - to: 'oncall@cleaning-app.com'
    subject: '[CRITICAL] {{ .GroupLabels.alertname }}'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#alerts'
    title: 'CRITICAL Alert'
    text: |
      {{ range .Alerts }}
      {{ .Annotations.summary }}
      {{ .Annotations.description }}
      {{ end }}
  pagerduty_configs:
  - routing_key: 'YOUR_PAGERDUTY_KEY'

- name: 'database-team'
  email_configs:
  - to: 'dba@cleaning-app.com'
    subject: '[DATABASE] {{ .GroupLabels.alertname }}'

inhibit_rules:
- source_match:
    severity: 'critical'
  target_match:
    severity: 'warning'
  equal: ['alertname', 'cluster', 'service']
```

### Notifications Slack

```typescript
// Intégration Slack pour les alertes personnalisées
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_TOKEN);

export const sendSlackAlert = async (alert: {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  details?: any;
}) => {
  const colors = {
    info: '#36a64f',
    warning: '#ffeb3b',
    critical: '#f44336'
  };

  const attachment = {
    color: colors[alert.severity],
    title: alert.title,
    text: alert.message,
    fields: [
      {
        title: 'Severity',
        value: alert.severity.toUpperCase(),
        short: true
      },
      {
        title: 'Timestamp',
        value: new Date().toISOString(),
        short: true
      }
    ],
    footer: 'Cleaning App Monitoring',
    ts: Math.floor(Date.now() / 1000)
  };

  if (alert.details) {
    attachment.fields.push({
      title: 'Details',
      value: JSON.stringify(alert.details, null, 2),
      short: false
    });
  }

  await slack.chat.postMessage({
    channel: '#monitoring',
    text: alert.title,
    attachments: [attachment]
  });
};
```

## Surveillance de Performance

### Métriques SLI/SLO

```yaml
# Service Level Indicators (SLI) et Service Level Objectives (SLO)
sli_slo_config:
  availability:
    sli: "avg_over_time(up[5m])"
    slo: 0.999  # 99.9% uptime
    
  error_rate:
    sli: "rate(http_requests_total{status_code=~'5..'}[5m]) / rate(http_requests_total[5m])"
    slo: 0.01   # < 1% error rate
    
  response_time:
    sli: "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
    slo: 1.0    # P95 < 1 second
```

### Dashboard SLO

```json
{
  "dashboard": {
    "title": "SLO Dashboard",
    "panels": [
      {
        "title": "Availability SLO",
        "type": "stat",
        "targets": [
          {
            "expr": "avg_over_time(up[30d])",
            "legendFormat": "Availability"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percentunit",
            "min": 0.995,
            "max": 1,
            "thresholds": {
              "steps": [
                {"color": "red", "value": null},
                {"color": "yellow", "value": 0.999},
                {"color": "green", "value": 0.9995}
              ]
            }
          }
        }
      },
      {
        "title": "Error Budget",
        "type": "timeseries",
        "targets": [
          {
            "expr": "1 - (sum(rate(http_requests_total{status_code=~'5..'}[1d])) / sum(rate(http_requests_total[1d])))",
            "legendFormat": "Error Budget Remaining"
          }
        ]
      }
    ]
  }
}
```

### Monitoring de la Performance Database

```sql
-- Requêtes de monitoring PostgreSQL
-- Connexions actives
SELECT 
    state,
    count(*) 
FROM pg_stat_activity 
GROUP BY state;

-- Requêtes lentes
SELECT 
    query,
    mean_exec_time,
    calls,
    total_exec_time
FROM pg_stat_statements 
WHERE mean_exec_time > 1000 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Utilisation des index
SELECT 
    indexrelname as index_name,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Taille des tables
SELECT 
    relname as table_name,
    pg_size_pretty(pg_total_relation_size(relid)) as total_size,
    pg_size_pretty(pg_relation_size(relid)) as table_size,
    pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as index_size
FROM pg_stat_user_tables 
ORDER BY pg_total_relation_size(relid) DESC;
```

## Monitoring de Sécurité

### Métriques de Sécurité

```typescript
// Collecte de métriques de sécurité spécialisées
const securityMetrics = {
  authenticationAttempts: new Counter({
    name: 'auth_attempts_total',
    help: 'Total authentication attempts',
    labelNames: ['status', 'ip', 'user_agent']
  }),
  
  rateLimitHits: new Counter({
    name: 'rate_limit_hits_total',
    help: 'Total rate limit violations',
    labelNames: ['endpoint', 'ip']
  }),
  
  suspiciousActivities: new Counter({
    name: 'suspicious_activities_total',
    help: 'Total suspicious activities detected',
    labelNames: ['type', 'severity']
  }),
  
  failedAuthorizations: new Counter({
    name: 'failed_authorizations_total',
    help: 'Total failed authorization attempts',
    labelNames: ['resource', 'user_role']
  })
};
```

### Dashboard Sécurité

```json
{
  "dashboard": {
    "title": "Security Dashboard",
    "panels": [
      {
        "title": "Authentication Failures",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(auth_attempts_total{status=\"failed\"}[5m])",
            "legendFormat": "Failed Attempts/sec"
          }
        ]
      },
      {
        "title": "Rate Limit Violations",
        "type": "timeseries",
        "targets": [
          {
            "expr": "increase(rate_limit_hits_total[1h])",
            "legendFormat": "{{endpoint}}"
          }
        ]
      },
      {
        "title": "Top Failed Login IPs",
        "type": "table",
        "targets": [
          {
            "expr": "topk(10, sum by (ip) (increase(auth_attempts_total{status=\"failed\"}[24h])))",
            "format": "table"
          }
        ]
      }
    ]
  }
}
```

## Maintenance et Optimisation

### Maintenance Automatisée

```bash
#!/bin/bash
# Script de maintenance du monitoring

monitoring_maintenance() {
    echo "Maintenance du système de monitoring..."
    
    # 1. Nettoyage des métriques anciennes
    echo "Nettoyage des métriques Prometheus..."
    curl -X POST http://prometheus:9090/api/v1/admin/tsdb/clean_tombstones
    
    # 2. Optimisation Loki
    echo "Optimisation Loki..."
    curl -X POST http://loki:3100/loki/api/v1/delete?query={job="old-job"}&start=2023-01-01T00:00:00Z&end=2023-01-02T00:00:00Z
    
    # 3. Sauvegarde des dashboards Grafana
    echo "Sauvegarde des dashboards..."
    mkdir -p backups/grafana-$(date +%Y%m%d)
    
    for dashboard_uid in $(curl -s -H "Authorization: Bearer $GRAFANA_API_KEY" \
        http://grafana:3000/api/search | jq -r '.[].uid'); do
        curl -s -H "Authorization: Bearer $GRAFANA_API_KEY" \
            http://grafana:3000/api/dashboards/uid/$dashboard_uid \
            > backups/grafana-$(date +%Y%m%d)/$dashboard_uid.json
    done
    
    # 4. Vérification de l'espace disque
    echo "Vérification de l'espace disque..."
    df -h /var/lib/prometheus
    df -h /var/lib/grafana
    
    echo "Maintenance terminée"
}
```

### Optimisation des Requêtes

```promql
# Requêtes optimisées pour de meilleures performances

# Au lieu de : rate(http_requests_total[5m])
# Utiliser avec agrégation :
sum(rate(http_requests_total[5m])) by (method, status)

# Utiliser recording rules pour les calculs complexes
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)

# Limiter les séries temporelles avec des labels spécifiques
rate(http_requests_total{job="backend", method=~"GET|POST"}[5m])
```

## Troubleshooting

### Problèmes Courants

#### Prometheus

```bash
# Vérifier le statut Prometheus
curl http://prometheus:9090/-/healthy

# Vérifier les targets
curl http://prometheus:9090/api/v1/targets

# Vérifier la configuration
curl http://prometheus:9090/api/v1/status/config

# Logs Prometheus
docker logs cleaning-app-prometheus
```

#### Grafana

```bash
# Vérifier la connectivité aux datasources
curl -H "Authorization: Bearer $GRAFANA_API_KEY" \
  http://grafana:3000/api/datasources

# Tester une requête
curl -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"queries":[{"expr":"up","refId":"A"}],"from":"now-1h","to":"now"}' \
  http://grafana:3000/api/ds/query

# Logs Grafana
docker logs cleaning-app-grafana
```

#### Loki/Promtail

```bash
# Vérifier les logs Loki
curl http://loki:3100/ready

# Vérifier les labels disponibles
curl http://loki:3100/loki/api/v1/labels

# Tester une requête LogQL
curl -G -s "http://loki:3100/loki/api/v1/query" \
  --data-urlencode 'query={job="backend"}' \
  --data-urlencode 'limit=10'

# Status Promtail
curl http://promtail:9080/targets
```

### Diagnostic des Performances

```bash
#!/bin/bash
# Script de diagnostic des performances de monitoring

diagnose_monitoring() {
    echo "Diagnostic du système de monitoring..."
    
    # 1. Utilisation ressources Prometheus
    echo "=== Prometheus ==="
    curl -s http://prometheus:9090/api/v1/query?query=prometheus_tsdb_symbol_table_size_bytes | jq '.data.result[0].value[1]'
    curl -s http://prometheus:9090/api/v1/query?query=prometheus_tsdb_head_series | jq '.data.result[0].value[1]'
    
    # 2. Performance requêtes
    echo "=== Slow Queries ==="
    curl -s http://prometheus:9090/api/v1/query?query=prometheus_engine_query_duration_seconds | jq '.data.result'
    
    # 3. Utilisation mémoire Grafana
    echo "=== Grafana ==="
    docker stats cleaning-app-grafana --no-stream --format "table {{.MemUsage}}\t{{.CPUPerc}}"
    
    # 4. Santé Loki
    echo "=== Loki ==="
    curl -s http://loki:3100/metrics | grep loki_ingester_memory_chunks
    
    echo "Diagnostic terminé"
}
```

---

## Checklist de Monitoring

### Configuration Initiale
- [ ] Prometheus configuré et fonctionnel
- [ ] Grafana accessible avec dashboards
- [ ] Loki collecte les logs correctement
- [ ] AlertManager configuré avec notifications
- [ ] Métriques applicatives exposées
- [ ] Métriques système collectées

### Dashboards Essentiels
- [ ] Application Overview
- [ ] System Resources
- [ ] Database Performance
- [ ] Security Metrics
- [ ] Business Metrics
- [ ] SLO Dashboard

### Alertes Critiques
- [ ] Service indisponible
- [ ] Taux d'erreur élevé
- [ ] Temps de réponse dégradé
- [ ] Ressources système critiques
- [ ] Incidents de sécurité
- [ ] Violation SLO

### Maintenance Régulière
- [ ] Sauvegarde des configurations
- [ ] Nettoyage des métriques anciennes
- [ ] Optimisation des requêtes
- [ ] Mise à jour des alertes
- [ ] Test des notifications
- [ ] Review des dashboards

---

*Cette documentation doit être maintenue à jour avec l'évolution de l'architecture de monitoring.*