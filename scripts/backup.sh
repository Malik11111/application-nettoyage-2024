#!/bin/bash

# Cleaning App Backup Script
# Usage: ./backup.sh [environment] [backup_type]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-production}"
BACKUP_TYPE="${2:-full}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_ROOT="$PROJECT_DIR/backups"
BACKUP_DIR="$BACKUP_ROOT/${ENVIRONMENT}_${BACKUP_TYPE}_$TIMESTAMP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    log_success "Created backup directory: $BACKUP_DIR"
}

# Backup database
backup_database() {
    log_info "Backing up PostgreSQL database..."
    
    local compose_file="$PROJECT_DIR/docker-compose.$ENVIRONMENT.yml"
    
    if [[ ! -f "$compose_file" ]]; then
        log_error "Docker Compose file not found: $compose_file"
        return 1
    fi
    
    # Check if postgres container is running
    if ! docker-compose -f "$compose_file" ps postgres | grep -q "Up"; then
        log_error "PostgreSQL container is not running"
        return 1
    fi
    
    # Create database dump
    docker-compose -f "$compose_file" exec -T postgres pg_dumpall -U postgres > "$BACKUP_DIR/postgres_full_backup.sql"
    
    # Create compressed backup
    gzip -c "$BACKUP_DIR/postgres_full_backup.sql" > "$BACKUP_DIR/postgres_full_backup.sql.gz"
    rm "$BACKUP_DIR/postgres_full_backup.sql"
    
    # Create individual database backup
    docker-compose -f "$compose_file" exec -T postgres pg_dump -U postgres cleaning_app > "$BACKUP_DIR/postgres_cleaning_app.sql"
    gzip -c "$BACKUP_DIR/postgres_cleaning_app.sql" > "$BACKUP_DIR/postgres_cleaning_app.sql.gz"
    rm "$BACKUP_DIR/postgres_cleaning_app.sql"
    
    log_success "Database backup completed"
}

# Backup application configuration
backup_config() {
    log_info "Backing up application configuration..."
    
    # Backup docker-compose files
    cp "$PROJECT_DIR/docker-compose.$ENVIRONMENT.yml" "$BACKUP_DIR/"
    
    # Backup nginx configuration
    if [[ -d "$PROJECT_DIR/nginx" ]]; then
        cp -r "$PROJECT_DIR/nginx" "$BACKUP_DIR/"
    fi
    
    # Backup monitoring configuration
    if [[ -d "$PROJECT_DIR/monitoring" ]]; then
        cp -r "$PROJECT_DIR/monitoring" "$BACKUP_DIR/"
    fi
    
    # Backup scripts
    cp -r "$PROJECT_DIR/scripts" "$BACKUP_DIR/"
    
    # Backup secrets (if they exist and we have permission)
    if [[ -d "$PROJECT_DIR/secrets" ]]; then
        cp -r "$PROJECT_DIR/secrets" "$BACKUP_DIR/"
        chmod 600 "$BACKUP_DIR/secrets"/*
    fi
    
    log_success "Configuration backup completed"
}

# Backup Docker volumes
backup_volumes() {
    log_info "Backing up Docker volumes..."
    
    local compose_file="$PROJECT_DIR/docker-compose.$ENVIRONMENT.yml"
    local volumes_dir="$BACKUP_DIR/volumes"
    mkdir -p "$volumes_dir"
    
    # Get list of volumes
    local volumes=$(docker-compose -f "$compose_file" config --volumes)
    
    for volume in $volumes; do
        log_info "Backing up volume: $volume"
        
        # Create a temporary container to access the volume
        docker run --rm \
            -v "${volume}:/backup-source:ro" \
            -v "$volumes_dir:/backup-dest" \
            alpine:latest \
            tar czf "/backup-dest/${volume}.tar.gz" -C /backup-source .
        
        log_success "Volume $volume backed up"
    done
    
    log_success "Volumes backup completed"
}

# Backup logs
backup_logs() {
    log_info "Backing up application logs..."
    
    local compose_file="$PROJECT_DIR/docker-compose.$ENVIRONMENT.yml"
    local logs_dir="$BACKUP_DIR/logs"
    mkdir -p "$logs_dir"
    
    # Get container logs
    local containers=$(docker-compose -f "$compose_file" ps --services)
    
    for container in $containers; do
        log_info "Backing up logs for: $container"
        docker-compose -f "$compose_file" logs "$container" > "$logs_dir/${container}.log" 2>&1 || true
        gzip "$logs_dir/${container}.log"
    done
    
    log_success "Logs backup completed"
}

# Create backup manifest
create_manifest() {
    log_info "Creating backup manifest..."
    
    cat > "$BACKUP_DIR/backup_manifest.txt" << EOF
Cleaning App Backup Manifest
============================

Backup Information:
- Environment: $ENVIRONMENT
- Type: $BACKUP_TYPE
- Date: $(date)
- Timestamp: $TIMESTAMP

Backup Contents:
$(ls -la "$BACKUP_DIR")

System Information:
- Docker Version: $(docker --version)
- Docker Compose Version: $(docker-compose --version)
- Host: $(hostname)
- User: $(whoami)

Database Information:
$(docker-compose -f "$PROJECT_DIR/docker-compose.$ENVIRONMENT.yml" exec -T postgres psql -U postgres -c "\l" 2>/dev/null || echo "Database not accessible")

Container Status:
$(docker-compose -f "$PROJECT_DIR/docker-compose.$ENVIRONMENT.yml" ps)
EOF
    
    log_success "Backup manifest created"
}

# Compress backup
compress_backup() {
    log_info "Compressing backup..."
    
    cd "$BACKUP_ROOT"
    tar czf "${ENVIRONMENT}_${BACKUP_TYPE}_$TIMESTAMP.tar.gz" "$(basename "$BACKUP_DIR")"
    
    local compressed_size=$(du -sh "${ENVIRONMENT}_${BACKUP_TYPE}_$TIMESTAMP.tar.gz" | cut -f1)
    log_success "Backup compressed: ${ENVIRONMENT}_${BACKUP_TYPE}_$TIMESTAMP.tar.gz ($compressed_size)"
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    local keep_days=${BACKUP_RETENTION_DAYS:-30}
    
    # Remove backups older than specified days
    find "$BACKUP_ROOT" -name "*.tar.gz" -type f -mtime +$keep_days -delete || true
    find "$BACKUP_ROOT" -type d -empty -delete || true
    
    log_success "Old backups cleaned up (kept last $keep_days days)"
}

# Upload backup to remote storage (placeholder)
upload_backup() {
    if [[ "${ENABLE_REMOTE_BACKUP:-false}" == "true" ]]; then
        log_info "Uploading backup to remote storage..."
        
        # Example: Upload to S3
        # aws s3 cp "$BACKUP_ROOT/${ENVIRONMENT}_${BACKUP_TYPE}_$TIMESTAMP.tar.gz" "s3://your-backup-bucket/cleaning-app/"
        
        # Example: Upload to Google Cloud Storage
        # gsutil cp "$BACKUP_ROOT/${ENVIRONMENT}_${BACKUP_TYPE}_$TIMESTAMP.tar.gz" "gs://your-backup-bucket/cleaning-app/"
        
        # Example: Upload via rsync
        # rsync -av "$BACKUP_ROOT/${ENVIRONMENT}_${BACKUP_TYPE}_$TIMESTAMP.tar.gz" user@backup-server:/path/to/backups/
        
        log_info "Remote backup upload is not configured. Add your upload logic here."
    fi
}

# Main backup function
main() {
    log_info "Starting $BACKUP_TYPE backup for $ENVIRONMENT environment..."
    
    # Validate inputs
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Use 'staging' or 'production'."
        exit 1
    fi
    
    if [[ "$BACKUP_TYPE" != "full" && "$BACKUP_TYPE" != "database" && "$BACKUP_TYPE" != "config" ]]; then
        log_error "Invalid backup type: $BACKUP_TYPE. Use 'full', 'database', or 'config'."
        exit 1
    fi
    
    create_backup_dir
    
    case "$BACKUP_TYPE" in
        "full")
            backup_database
            backup_config
            backup_volumes
            backup_logs
            ;;
        "database")
            backup_database
            ;;
        "config")
            backup_config
            ;;
    esac
    
    create_manifest
    compress_backup
    cleanup_old_backups
    upload_backup
    
    # Remove uncompressed backup directory
    rm -rf "$BACKUP_DIR"
    
    log_success "Backup completed successfully!"
    log_info "Backup file: $BACKUP_ROOT/${ENVIRONMENT}_${BACKUP_TYPE}_$TIMESTAMP.tar.gz"
}

# Handle script arguments
case "${1:-}" in
    "help"|"--help"|"-h")
        echo "Usage: $0 [environment] [backup_type]"
        echo ""
        echo "Arguments:"
        echo "  environment   staging or production (default: production)"
        echo "  backup_type   full, database, or config (default: full)"
        echo ""
        echo "Examples:"
        echo "  $0                    # Full backup of production"
        echo "  $0 staging           # Full backup of staging"
        echo "  $0 production database   # Database only backup"
        echo ""
        echo "Environment variables:"
        echo "  BACKUP_RETENTION_DAYS    Days to keep backups (default: 30)"
        echo "  ENABLE_REMOTE_BACKUP     Enable remote backup upload (default: false)"
        exit 0
        ;;
    *)
        main
        ;;
esac