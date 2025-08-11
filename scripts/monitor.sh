#!/bin/bash

# Cleaning App Monitoring Script
# Usage: ./monitor.sh [check|status|logs|metrics]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${ENVIRONMENT:-production}"

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

# Check service health
check_health() {
    log_info "Checking application health..."
    
    local compose_file="$PROJECT_DIR/docker-compose.$ENVIRONMENT.yml"
    local exit_code=0
    
    # Check if containers are running
    log_info "Container Status:"
    docker-compose -f "$compose_file" ps
    
    echo ""
    
    # Check health endpoints
    log_info "Health Check Results:"
    
    # Main health endpoint
    if curl -f -s http://localhost/api/health > /dev/null; then
        log_success "✓ Main health endpoint: OK"
    else
        log_error "✗ Main health endpoint: FAILED"
        exit_code=1
    fi
    
    # Detailed health endpoint
    if curl -f -s http://localhost/api/health/detailed > /dev/null; then
        log_success "✓ Detailed health endpoint: OK"
    else
        log_error "✗ Detailed health endpoint: FAILED"
        exit_code=1
    fi
    
    # Legacy health endpoint
    if curl -f -s http://localhost/health > /dev/null; then
        log_success "✓ Legacy health endpoint: OK"
    else
        log_error "✗ Legacy health endpoint: FAILED"
        exit_code=1
    fi
    
    # Prometheus metrics
    if curl -f -s http://localhost/api/metrics > /dev/null; then
        log_success "✓ Metrics endpoint: OK"
    else
        log_warning "⚠ Metrics endpoint: FAILED"
    fi
    
    return $exit_code
}

# Show detailed status
show_status() {
    log_info "Application Status Report"
    echo "=========================="
    
    local compose_file="$PROJECT_DIR/docker-compose.$ENVIRONMENT.yml"
    
    # Container status
    echo ""
    log_info "Container Status:"
    docker-compose -f "$compose_file" ps
    
    # Resource usage
    echo ""
    log_info "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
    
    # Health checks
    echo ""
    check_health
    
    # Recent logs (errors only)
    echo ""
    log_info "Recent Errors (last 50 lines):"
    docker-compose -f "$compose_file" logs --tail=50 | grep -i error || echo "No recent errors found"
    
    # Disk usage
    echo ""
    log_info "Disk Usage:"
    df -h | grep -E "(Filesystem|/dev/)"
    
    # Database status
    echo ""
    log_info "Database Status:"
    if docker-compose -f "$compose_file" exec -T postgres psql -U postgres -c "SELECT version();" > /dev/null 2>&1; then
        log_success "✓ Database: Connected"
        docker-compose -f "$compose_file" exec -T postgres psql -U postgres -c "
            SELECT 
                datname as database,
                numbackends as connections,
                pg_size_pretty(pg_database_size(datname)) as size
            FROM pg_stat_database 
            WHERE datname = 'cleaning_app';"
    else
        log_error "✗ Database: Connection failed"
    fi
}

# Show logs
show_logs() {
    local service="${1:-}"
    local lines="${2:-100}"
    local compose_file="$PROJECT_DIR/docker-compose.$ENVIRONMENT.yml"
    
    if [[ -n "$service" ]]; then
        log_info "Showing last $lines lines of logs for $service:"
        docker-compose -f "$compose_file" logs --tail="$lines" "$service"
    else
        log_info "Showing last $lines lines of logs for all services:"
        docker-compose -f "$compose_file" logs --tail="$lines"
    fi
}

# Show metrics
show_metrics() {
    log_info "Application Metrics"
    echo "==================="
    
    # Get detailed health information
    echo ""
    log_info "Health Metrics:"
    curl -s http://localhost/api/health/detailed | jq '.' 2>/dev/null || curl -s http://localhost/api/health/detailed
    
    # Get Prometheus metrics
    echo ""
    log_info "Prometheus Metrics (sample):"
    curl -s http://localhost/api/metrics | head -20
    
    # Database metrics
    local compose_file="$PROJECT_DIR/docker-compose.$ENVIRONMENT.yml"
    echo ""
    log_info "Database Metrics:"
    docker-compose -f "$compose_file" exec -T postgres psql -U postgres -c "
        SELECT 
            'active_connections' as metric,
            count(*) as value
        FROM pg_stat_activity 
        WHERE state = 'active'
        UNION ALL
        SELECT 
            'total_connections' as metric,
            count(*) as value
        FROM pg_stat_activity
        UNION ALL
        SELECT 
            'database_size' as metric,
            pg_size_pretty(pg_database_size('cleaning_app'))::text as value;" 2>/dev/null || log_error "Could not retrieve database metrics"
}

# Performance monitoring
performance_monitor() {
    log_info "Performance Monitoring"
    echo "======================"
    
    local compose_file="$PROJECT_DIR/docker-compose.$ENVIRONMENT.yml"
    local duration="${1:-60}"
    
    log_info "Monitoring performance for $duration seconds..."
    
    # Monitor for specified duration
    for ((i=1; i<=duration; i++)); do
        echo "Sample $i/$duration:"
        
        # CPU and Memory
        docker stats --no-stream --format "{{.Container}}: CPU {{.CPUPerc}}, Memory {{.MemUsage}}"
        
        # Response time
        local response_time=$(curl -w "%{time_total}" -s -o /dev/null http://localhost/api/health || echo "timeout")
        echo "API Response Time: ${response_time}s"
        
        # Active connections
        local connections=$(docker-compose -f "$compose_file" exec -T postgres psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | tr -d ' ' || echo "N/A")
        echo "Active DB Connections: $connections"
        
        echo "---"
        sleep 1
    done
    
    log_success "Performance monitoring completed"
}

# Alert check
check_alerts() {
    log_info "Checking for alert conditions..."
    
    local compose_file="$PROJECT_DIR/docker-compose.$ENVIRONMENT.yml"
    local alerts=()
    
    # Check CPU usage
    local cpu_usage=$(docker stats --no-stream --format "{{.CPUPerc}}" | sed 's/%//' | awk '{sum+=$1} END {print sum/NR}')
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        alerts+=("High CPU usage: ${cpu_usage}%")
    fi
    
    # Check memory usage
    local mem_usage=$(docker stats --no-stream --format "{{.MemPerc}}" | sed 's/%//' | awk '{sum+=$1} END {print sum/NR}')
    if (( $(echo "$mem_usage > 85" | bc -l) )); then
        alerts+=("High memory usage: ${mem_usage}%")
    fi
    
    # Check disk space
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if (( disk_usage > 90 )); then
        alerts+=("High disk usage: ${disk_usage}%")
    fi
    
    # Check database connections
    local db_connections=$(docker-compose -f "$compose_file" exec -T postgres psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ' || echo "0")
    if (( db_connections > 80 )); then
        alerts+=("High database connections: $db_connections")
    fi
    
    # Report alerts
    if [[ ${#alerts[@]} -gt 0 ]]; then
        log_error "ALERTS DETECTED:"
        for alert in "${alerts[@]}"; do
            log_error "  - $alert"
        done
        return 1
    else
        log_success "No alerts detected"
        return 0
    fi
}

# Main function
main() {
    local action="${1:-check}"
    
    case "$action" in
        "check"|"health")
            check_health
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "${2:-}" "${3:-100}"
            ;;
        "metrics")
            show_metrics
            ;;
        "monitor")
            performance_monitor "${2:-60}"
            ;;
        "alerts")
            check_alerts
            ;;
        "help"|"--help"|"-h")
            echo "Usage: $0 [action] [options]"
            echo ""
            echo "Actions:"
            echo "  check, health    - Check application health"
            echo "  status          - Show detailed application status"
            echo "  logs [service] [lines] - Show logs (default: all services, 100 lines)"
            echo "  metrics         - Show application metrics"
            echo "  monitor [seconds] - Monitor performance (default: 60 seconds)"
            echo "  alerts          - Check for alert conditions"
            echo ""
            echo "Examples:"
            echo "  $0 check                    # Health check"
            echo "  $0 logs backend 50          # Show last 50 lines of backend logs"
            echo "  $0 monitor 120              # Monitor for 2 minutes"
            ;;
        *)
            log_error "Unknown action: $action"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"