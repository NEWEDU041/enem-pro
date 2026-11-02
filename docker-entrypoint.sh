#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ENEM Pro Docker Entrypoint
# 
# Runs initialization and then starts the application
# ═══════════════════════════════════════════════════════════════

set -e

echo "🚀 ENEM Pro entrypoint starting..."

# Run database initialization if this is the main app service
if [ "$ENTRYPOINT_TYPE" = "app" ] || [ -z "$ENTRYPOINT_TYPE" ]; then
  echo "📊 Initializing database..."
  if [ -f "/app/scripts/init-db.sh" ]; then
    bash /app/scripts/init-db.sh
  else
    echo "⚠️  init-db.sh not found, skipping database initialization"
  fi
fi

echo "✅ Entrypoint complete, starting service..."

# Execute the original command
exec "$@"
