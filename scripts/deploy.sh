#!/bin/bash

# Cleaning App Deployment Script
# Usage: ./deploy.sh [staging|production]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-staging}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$PROJECT_DIR/backups/$TIMESTAMP"

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

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    log_success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose >/dev/null 2>&1; then
        log_error "docker-compose is not installed. Please install it and try again."
        exit 1
    fi
    log_success "docker-compose is available"
}

# Validate environment
validate_environment() {
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Use 'staging' or 'production'."
        exit 1
    fi
    log_info "Deploying to: $ENVIRONMENT"
}

# Create backup of current deployment
create_backup() {
    log_info "Creating backup of current deployment..."
    mkdir -p "$BACKUP_DIR"
    
    if [[ -f "$PROJECT_DIR/docker-compose.$ENVIRONMENT.yml" ]]; then
        # Export current container data
        docker-compose -f "$PROJECT_DIR/docker-compose.$ENVIRONMENT.yml" exec -T postgres pg_dumpall -U postgres > "$BACKUP_DIR/postgres_backup.sql" || true
        
        # Backup current configuration
        cp -r "$PROJECT_DIR" "$BACKUP_DIR/app_config" 2>/dev/null || true
        
        log_success "Backup created at: $BACKUP_DIR"
    else
        log_warning "No existing deployment found to backup"
    fi
}

# Build images
build_images() {
    log_info "Building Docker images..."
    
    # Build backend
    log_info "Building backend image..."
    docker build -t "cleaning-app-backend:$ENVIRONMENT" "$PROJECT_DIR/backend/"
    
    # Build frontend
    log_info "Building frontend image..."
    docker build -t "cleaning-app-frontend:$ENVIRONMENT" "$PROJECT_DIR/frontend/"
    
    # Build nginx
    log_info "Building nginx image..."
    docker build -t "cleaning-app-nginx:$ENVIRONMENT" "$PROJECT_DIR/nginx/"
    
    log_success "All images built successfully"
}

# Check if secrets are configured
check_secrets() {
    log_info "Checking secrets configuration..."
    
    local secrets_dir="$PROJECT_DIR/secrets"
    local required_secrets=(
        "postgres_db.txt"
        "postgres_user.txt"
        "postgres_password.txt"
        "database_url.txt"
        "jwt_secret.txt"
        "redis_password.txt"
        "redis_url.txt"
        "grafana_admin_password.txt"
    )
    
    local missing_secrets=()
    
    for secret in "${required_secrets[@]}"; do
        if [[ ! -f "$secrets_dir/$secret" ]]; then
            missing_secrets+=("$secret")
        fi
    done
    
    if [[ ${#missing_secrets[@]} -gt 0 ]]; then
        log_error "Missing secrets files:"
        for secret in "${missing_secrets[@]}"; do
            log_error "  - $secrets_dir/$secret"
        done
        log_info "Run './scripts/setup-secrets.sh' to create them"
        exit 1
    fi
    
    log_success "All secrets are configured"
}

# Generate SSL certificates if needed
setup_ssl() {
    local ssl_dir="$PROJECT_DIR/nginx/ssl"
    
    if [[ ! -f "$ssl_dir/nginx-selfsigned.crt" ]] || [[ ! -f "$ssl_dir/nginx-selfsigned.key" ]]; then
        log_info "Generating SSL certificates..."
        mkdir -p "$ssl_dir"
        
        # Generate self-signed certificate for development/testing
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$ssl_dir/nginx-selfsigned.key" \
            -out "$ssl_dir/nginx-selfsigned.crt" \
            -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"
        
        # Generate DH parameters
        openssl dhparam -out "$ssl_dir/dhparam.pem" 2048
        
        log_success "SSL certificates generated"
    else
        log_success "SSL certificates already exist"
    fi
}

# Deploy application
deploy_app() {
    log_info "Deploying application..."
    
    local compose_file="$PROJECT_DIR/docker-compose.$ENVIRONMENT.yml"
    
    if [[ ! -f "$compose_file" ]]; then
        log_error "Docker Compose file not found: $compose_file"
        exit 1
    fi
    
    # Stop existing services
    log_info "Stopping existing services..."
    docker-compose -f "$compose_file" down --remove-orphans || true
    
    # Pull latest images (if using remote registry)
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Pulling latest images..."
        docker-compose -f "$compose_file" pull || true
    fi
    
    # Start services
    log_info "Starting services..."
    docker-compose -f "$compose_file" up -d
    
    log_success "Application deployed"
}

# Wait for services to be healthy
wait_for_health() {
    log_info "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -f http://localhost/api/health >/dev/null 2>&1; then
            log_success "Application is healthy"
            return 0
        fi
        
        attempt=$((attempt + 1))
        log_info "Health check attempt $attempt/$max_attempts..."
        sleep 10
    done
    
    log_error "Application failed to become healthy within expected time"
    return 1
}

# Run smoke tests
run_smoke_tests() {
    log_info "Running smoke tests..."
    
    local base_url="http://localhost"
    if [[ "$ENVIRONMENT" == "production" ]]; then
        base_url="https://localhost"
    fi
    
    # Test health endpoints
    curl -f "$base_url/api/health" || { log_error "Health check failed"; return 1; }
    curl -f "$base_url/api/health/detailed" || { log_error "Detailed health check failed"; return 1; }
    curl -f "$base_url/health" || { log_error "Legacy health check failed"; return 1; }
    
    log_success "All smoke tests passed"
}

# Cleanup old images and containers
cleanup() {
    log_info "Cleaning up old images and containers..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused networks
    docker network prune -f
    
    # Remove unused volumes (be careful with this in production)
    if [[ "$ENVIRONMENT" != "production" ]]; then
        docker volume prune -f
    fi
    
    log_success "Cleanup completed"
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    local compose_file="$PROJECT_DIR/docker-compose.$ENVIRONMENT.yml"
    
    if [[ -d "$BACKUP_DIR" ]]; then
        # Stop current services
        docker-compose -f "$compose_file" down
        
        # Restore database if backup exists
        if [[ -f "$BACKUP_DIR/postgres_backup.sql" ]]; then
            log_info "Restoring database..."
            docker-compose -f "$compose_file" up -d postgres
            sleep 10
            cat "$BACKUP_DIR/postgres_backup.sql" | docker-compose -f "$compose_file" exec -T postgres psql -U postgres
        fi
        
        # Restart services
        docker-compose -f "$compose_file" up -d
        
        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
        exit 1
    fi
}

# Main deployment function
main() {
    log_info "Starting deployment of Cleaning App to $ENVIRONMENT"
    
    # Pre-deployment checks
    validate_environment
    check_docker
    check_docker_compose
    check_secrets
    
    # Create backup
    create_backup
    
    # Setup SSL
    setup_ssl
    
    # Build and deploy
    build_images
    deploy_app
    
    # Post-deployment verification
    if wait_for_health; then
        run_smoke_tests
        cleanup
        log_success "Deployment completed successfully!"
        log_info "Application is available at: http://localhost (staging) or https://localhost (production)"
    else
        log_error "Deployment failed health checks"
        log_warning "Consider rolling back with: ./deploy.sh rollback"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "rollback")
        rollback
        ;;
    "staging"|"production"|"")
        main
        ;;
    *)
        log_error "Usage: $0 [staging|production|rollback]"
        exit 1
        ;;
esac