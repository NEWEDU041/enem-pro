#!/bin/bash
# Script de deploy ENEM Pro - rode no SEU terminal (onde tem GitHub/Vercel)
# Usage: ./DEPLOY_NOW.sh

set -e

echo "=== ENEM Pro - Deploy ==="

cd "$(dirname "$0")"

echo "1. Pull latest..."
git pull origin master || true

echo "2. Push local commits..."
git push origin master

echo "3. Verificar deploy na Vercel..."
echo "   Acesse: https://vercel.com/dashboard -> enem-pro -> Deployments"
echo "   Ou rode: npx vercel --prod"

echo ""
echo "=== PÓS-DEPLOY (no servidor Hermes, após push) ==="
echo "O Hermes vai automaticamente:"
echo "  1. Verificar sitemap (378+ blog URLs)"
echo "  2. Ligar fábrica cron (15-30 posts/dia, 15 dias)"
echo "  3. Publicar 378 drafts restantes"
echo "  4. Submeter tudo no GSC Indexing API"
echo ""
echo "Deploy enviado! Avise o Hermes: 'deploy feito'"
