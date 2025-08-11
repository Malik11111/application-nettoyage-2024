#!/bin/bash

# Cleaning App Secrets Setup Script
# This script generates secure secrets for production deployment

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SECRETS_DIR="$PROJECT_DIR/secrets"

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

# Generate random password
generate_password() {
    local length=${1:-32}
    openssl rand -base64 "$length" | tr -d "=+/" | cut -c1-"$length"
}

# Create secrets directory
create_secrets_dir() {
    if [[ ! -d "$SECRETS_DIR" ]]; then
        mkdir -p "$SECRETS_DIR"
        chmod 700 "$SECRETS_DIR"
        log_success "Created secrets directory: $SECRETS_DIR"
    fi
}

# Generate database secrets
setup_database_secrets() {
    log_info "Setting up database secrets..."
    
    local db_name="cleaning_app"
    local db_user="postgres"
    local db_password=$(generate_password 32)
    local db_url="postgresql://${db_user}:${db_password}@postgres:5432/${db_name}"
    
    echo "$db_name" > "$SECRETS_DIR/postgres_db.txt"
    echo "$db_user" > "$SECRETS_DIR/postgres_user.txt"
    echo "$db_password" > "$SECRETS_DIR/postgres_password.txt"
    echo "$db_url" > "$SECRETS_DIR/database_url.txt"
    
    log_success "Database secrets generated"
}

# Generate JWT secret
setup_jwt_secret() {
    log_info "Setting up JWT secret..."
    
    local jwt_secret=$(generate_password 64)
    echo "$jwt_secret" > "$SECRETS_DIR/jwt_secret.txt"
    
    log_success "JWT secret generated"
}

# Generate Redis secrets
setup_redis_secrets() {
    log_info "Setting up Redis secrets..."
    
    local redis_password=$(generate_password 32)
    local redis_url="redis://:${redis_password}@redis:6379"
    
    echo "$redis_password" > "$SECRETS_DIR/redis_password.txt"
    echo "$redis_url" > "$SECRETS_DIR/redis_url.txt"
    
    log_success "Redis secrets generated"
}

# Generate monitoring secrets
setup_monitoring_secrets() {
    log_info "Setting up monitoring secrets..."
    
    local grafana_password=$(generate_password 16)
    echo "$grafana_password" > "$SECRETS_DIR/grafana_admin_password.txt"
    
    log_success "Monitoring secrets generated"
    log_info "Grafana admin password: $grafana_password"
}

# Set appropriate permissions
set_permissions() {
    log_info "Setting secure permissions..."
    
    find "$SECRETS_DIR" -type f -exec chmod 600 {} \;
    
    log_success "Permissions set"
}

# Create environment file template
create_env_template() {
    log_info "Creating environment template..."
    
    cat > "$PROJECT_DIR/.env.example" << 'EOF'
# Cleaning App Environment Variables Template
# Copy this file to .env and fill in your values

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/cleaning_app
POSTGRES_DB=cleaning_app
POSTGRES_USER=username
POSTGRES_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Application Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com

# Monitoring Configuration
GRAFANA_ADMIN_PASSWORD=admin-password

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF
    
    log_success "Environment template created: .env.example"
}

# Display secrets information
display_secrets_info() {
    log_info "Secrets have been generated and stored in: $SECRETS_DIR"
    log_warning "IMPORTANT SECURITY NOTES:"
    echo "  1. Never commit the secrets directory to version control"
    echo "  2. Backup these secrets securely"
    echo "  3. Restrict access to the secrets directory (permissions set to 600)"
    echo "  4. Consider using a proper secret management system in production"
    echo ""
    log_info "Generated secrets:"
    echo "  - postgres_db.txt"
    echo "  - postgres_user.txt"
    echo "  - postgres_password.txt"
    echo "  - database_url.txt"
    echo "  - jwt_secret.txt"
    echo "  - redis_password.txt"
    echo "  - redis_url.txt"
    echo "  - grafana_admin_password.txt"
    echo ""
    log_info "Grafana admin credentials:"
    echo "  Username: admin"
    echo "  Password: $(cat "$SECRETS_DIR/grafana_admin_password.txt")"
}

# Add secrets to gitignore
update_gitignore() {
    local gitignore="$PROJECT_DIR/.gitignore"
    
    if [[ ! -f "$gitignore" ]]; then
        touch "$gitignore"
    fi
    
    if ! grep -q "secrets/" "$gitignore" 2>/dev/null; then
        echo "" >> "$gitignore"
        echo "# Secrets" >> "$gitignore"
        echo "secrets/" >> "$gitignore"
        echo ".env" >> "$gitignore"
        log_success "Added secrets to .gitignore"
    fi
}

# Main function
main() {
    log_info "Setting up secrets for Cleaning App..."
    
    # Check if secrets already exist
    if [[ -d "$SECRETS_DIR" ]] && [[ -n "$(ls -A "$SECRETS_DIR" 2>/dev/null)" ]]; then
        log_warning "Secrets directory already exists and is not empty."
        read -p "Do you want to regenerate all secrets? This will overwrite existing ones. (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Secrets setup cancelled"
            exit 0
        fi
    fi
    
    create_secrets_dir
    setup_database_secrets
    setup_jwt_secret
    setup_redis_secrets
    setup_monitoring_secrets
    set_permissions
    create_env_template
    update_gitignore
    
    display_secrets_info
    
    log_success "Secrets setup completed!"
    log_info "You can now run the deployment script: ./scripts/deploy.sh [staging|production]"
}

# Run main function
main "$@"