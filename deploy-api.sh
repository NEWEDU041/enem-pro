#!/bin/bash
# ENEM-Pro API-Only Quick Deploy

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "[$(date)] Starting ENEM-Pro API deployment..."

# Build
echo "[$(date)] Building Docker image..."
docker build -f Dockerfile.backend -t enem-pro-api:latest .

# Stop any existing container
echo "[$(date)] Stopping existing containers..."
docker-compose -f docker-compose.api.yml down 2>/dev/null || true

# Start
echo "[$(date)] Starting API server..."
docker-compose -f docker-compose.api.yml up -d

# Wait for health
echo "[$(date)] Waiting for API to be healthy..."
for i in {1..30}; do
  if curl -s http://localhost:3101/health > /dev/null 2>&1; then
    echo "[$(date)] ✅ API is healthy!"
    break
  fi
  echo "  Attempt $i/30..."
  sleep 1
done

# Show status
echo "[$(date)] Deployment complete!"
echo ""
echo "Service status:"
docker-compose -f docker-compose.api.yml ps
echo ""
echo "Health check:"
curl -s http://localhost:3101/ | jq .
echo ""
echo "Logs:"
docker logs enem-pro-api --tail 10
