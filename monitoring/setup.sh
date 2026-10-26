#!/bin/bash

# ENEM Pro Monitoring Stack Management Script
# 
# Usage:
#   ./monitoring/setup.sh up      - Start monitoring stack
#   ./monitoring/setup.sh down    - Stop monitoring stack
#   ./monitoring/setup.sh logs    - View logs
#   ./monitoring/setup.sh validate - Validate configuration
#   ./monitoring/setup.sh test    - Run metrics tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi

    log_success "Docker and Docker Compose are installed"
}

validate_config() {
    log_info "Validating Prometheus configuration..."
    
    if ! docker run --rm -v "$SCRIPT_DIR/prometheus.yml:/prometheus.yml" \
        prom/prometheus:latest \
        promtool check config /prometheus.yml &>/dev/null; then
        log_error "Prometheus configuration is invalid"
        return 1
    fi
    log_success "Prometheus configuration is valid"

    log_info "Validating Alert rules..."
    if ! docker run --rm -v "$SCRIPT_DIR/alerts.yml:/alerts.yml" \
        prom/prometheus:latest \
        promtool check rules /alerts.yml &>/dev/null; then
        log_error "Alert rules are invalid"
        return 1
    fi
    log_success "Alert rules are valid"

    return 0
}

up() {
    log_info "Starting monitoring stack..."
    
    check_docker
    validate_config
    
    cd "$SCRIPT_DIR"
    docker-compose up -d
    
    log_success "Monitoring stack started!"
    
    echo ""
    echo "📊 Access points:"
    echo "  - Prometheus:   http://localhost:9090"
    echo "  - Grafana:      http://localhost:3000 (admin/admin)"
    echo "  - AlertManager: http://localhost:9093"
    echo ""
    log_warning "Waiting for services to be ready..."
    sleep 5
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        log_success "Services are running"
    else
        log_error "Services failed to start"
        docker-compose logs
        exit 1
    fi
}

down() {
    log_info "Stopping monitoring stack..."
    cd "$SCRIPT_DIR"
    docker-compose down
    log_success "Monitoring stack stopped"
}

logs() {
    cd "$SCRIPT_DIR"
    docker-compose logs -f "$@"
}

status() {
    log_info "Monitoring stack status:"
    cd "$SCRIPT_DIR"
    docker-compose ps
    
    echo ""
    log_info "Testing connectivity..."
    
    if curl -s -H "x-admin-secret: test" http://localhost:3000/api/metrics > /dev/null 2>&1; then
        log_success "Metrics endpoint is accessible"
    else
        log_warning "Metrics endpoint is not accessible (app may not be running)"
    fi
    
    if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
        log_success "Prometheus is healthy"
    else
        log_warning "Prometheus is not responding"
    fi
    
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Grafana is healthy"
    else
        log_warning "Grafana is not responding"
    fi
}

test_metrics() {
    log_info "Testing metrics collection..."
    
    if [ -z "$CRON_SECRET" ]; then
        log_error "CRON_SECRET environment variable is not set"
        echo "Set it with: export CRON_SECRET=your-secret"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    
    # Check if test script exists
    if [ ! -f "scripts/test-metrics.ts" ]; then
        log_error "Test script not found: scripts/test-metrics.ts"
        exit 1
    fi
    
    log_info "Running comprehensive metrics tests..."
    npx tsx scripts/test-metrics.ts
}

clean() {
    log_warning "Removing monitoring data volumes..."
    cd "$SCRIPT_DIR"
    docker-compose down -v
    log_success "Monitoring stack cleaned"
}

case "${1:-help}" in
    up)
        up
        ;;
    down)
        down
        ;;
    logs)
        shift
        logs "$@"
        ;;
    status)
        status
        ;;
    validate)
        validate_config
        ;;
    test)
        test_metrics
        ;;
    clean)
        clean
        ;;
    restart)
        down
        up
        ;;
    *)
        echo "ENEM Pro Monitoring Stack Manager"
        echo ""
        echo "Usage: ./monitoring/setup.sh <command>"
        echo ""
        echo "Commands:"
        echo "  up       - Start monitoring stack (Prometheus + Grafana + AlertManager)"
        echo "  down     - Stop monitoring stack"
        echo "  logs     - View container logs"
        echo "  status   - Check status of all services"
        echo "  validate - Validate Prometheus and Alert configurations"
        echo "  test     - Run metrics collection tests"
        echo "  clean    - Remove all monitoring data and volumes"
        echo "  restart  - Restart the monitoring stack"
        echo ""
        echo "Environment Variables:"
        echo "  CRON_SECRET - Required for metrics endpoint (for testing)"
        echo ""
        echo "Examples:"
        echo "  ./monitoring/setup.sh up"
        echo "  CRON_SECRET=my-secret ./monitoring/setup.sh test"
        echo "  ./monitoring/setup.sh logs prometheus"
        ;;
esac
