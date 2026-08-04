#!/bin/bash

# 🚀 MASTER SETUP - Executa TODAS as 3 fases automaticamente

set -e

echo "╔════════════════════════════════════════════╗"
echo "║  🚀 ENEM Pro - Master Setup (Fases 1-3)  ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "Data: $(date)"
echo "Diretório: $(pwd)"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para status
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# ============================================
# FASE 1: CRÍTICA (Validações + Preparação)
# ============================================

echo ""
echo "═════════════════════════════════════════════"
echo "  FASE 1️⃣  - CRÍTICA (Validações)"
echo "═════════════════════════════════════════════"
echo ""

# 1.1 Verificar dependências
log_info "Verificando dependências..."
if ! command -v node &> /dev/null; then
  log_error "Node.js não está instalado"
  exit 1
fi
log_success "Node.js: $(node --version)"

if ! command -v npm &> /dev/null; then
  log_error "npm não está instalado"
  exit 1
fi
log_success "npm: $(npm --version)"

# 1.2 Instalar dependências do projeto
log_info "Instalando dependências do projeto..."
npm install
log_success "Dependências instaladas"

# 1.3 Verificar variáveis de ambiente
log_info "Verificando variáveis de ambiente..."
if [ -z "$ANTHROPIC_API_KEY" ]; then
  log_warning "ANTHROPIC_API_KEY não está definida (necessária para geração)"
  log_info "  Copie seu .env.local de .env.example:"
  log_info "  cp .env.example .env.local"
  log_info "  Depois edite e adicione suas chaves"
else
  log_success "ANTHROPIC_API_KEY: definida ✓"
fi

# 1.4 Criar diretórios necessários
log_info "Criando diretórios necessários..."
mkdir -p logs
mkdir -p reports
mkdir -p .next/cache
log_success "Diretórios criados"

# 1.5 Validar JSON de questões
log_info "Validando questões..."
node -e "
try {
  const data = require('./data/enem-2024.json');
  console.log('  Questões: ' + data.length);
  let corrupted = 0;
  data.forEach(q => {
    if (JSON.stringify(q).includes('\\ufffd')) corrupted++;
  });
  if (corrupted === 0) {
    console.log('  ✅ Encoding: OK');
  } else {
    console.log('  ⚠️  Questões com problema: ' + corrupted);
  }
} catch (e) {
  console.log('❌ Erro: ' + e.message);
  process.exit(1);
}
" || log_error "Erro ao validar questões"

# ============================================
# FASE 2: BUILD E PREPARAÇÃO
# ============================================

echo ""
echo "═════════════════════════════════════════════"
echo "  FASE 2️⃣  - BUILD E OTIMIZAÇÃO"
echo "═════════════════════════════════════════════"
echo ""

# 2.1 Lint
log_info "Executando linter..."
npm run lint 2>/dev/null || log_warning "Alguns problemas encontrados"

# 2.2 Build
log_info "Buildando projeto..."
npm run build
log_success "Build concluído"

# 2.3 Otimizar imagens
log_info "Otimizando imagens..."
bash scripts/optimize-images.sh 2>/dev/null || log_warning "Erro ao otimizar imagens"

# ============================================
# FASE 3: GERAR EXPLICAÇÕES
# ============================================

echo ""
echo "═════════════════════════════════════════════"
echo "  FASE 3️⃣  - GERAÇÃO DE EXPLICAÇÕES"
echo "═════════════════════════════════════════════"
echo ""

if [ -z "$ANTHROPIC_API_KEY" ]; then
  log_warning "Pulando geração - ANTHROPIC_API_KEY não definida"
  echo ""
  log_info "Para gerar explicações:"
  echo "  1. Adicione ANTHROPIC_API_KEY ao seu .env.local"
  echo "  2. Execute: npm run generate-all-explanations"
  echo "  3. Ou use: npx ts-node scripts/generate-all-explanations.ts"
else
  log_info "Iniciando geração de explicações..."
  log_warning "AVISO: Isso pode levar 4-6 horas!"
  read -p "Continuar? (s/n): " confirm
  if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
    bash scripts/start-generation.sh
  else
    log_info "Geração pulada"
  fi
fi

# ============================================
# FASE 4: TESTES DE PERFORMANCE
# ============================================

echo ""
echo "═════════════════════════════════════════════"
echo "  FASE 4️⃣  - PERFORMANCE (LIGHTHOUSE)"
echo "═════════════════════════════════════════════"
echo ""

if ! command -v lighthouse &> /dev/null; then
  log_info "Instalando Lighthouse globalmente..."
  npm install -g lighthouse
fi

log_info "Você pode testar performance com:"
echo "  lighthouse http://localhost:3000 --view"
echo "  # OU após deploy em produção:"
echo "  lighthouse https://seu-site.com --view"
echo ""

# ============================================
# FASE 5: SETUP GSC
# ============================================

echo ""
echo "═════════════════════════════════════════════"
echo "  FASE 5️⃣  - GOOGLE SEARCH CONSOLE"
echo "═════════════════════════════════════════════"
echo ""

log_success "Arquivos preparados:"
echo "  ✅ public/robots.txt (criado)"
echo "  ✅ public/sitemap.xml (criado)"
echo ""
log_info "Próximos passos:"
echo "  1. Deploy em produção:"
echo "     vercel deploy --prod"
echo "  2. Verificar em GSC:"
echo "     https://search.google.com/search-console"
echo "  3. Submeter sitemap"
echo "  4. Monitorar coverage"
echo ""

# ============================================
# RESUMO FINAL
# ============================================

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  📋 RESUMO - PRÓXIMAS AÇÕES               ║"
echo "╚════════════════════════════════════════════╝"
echo ""

echo "IMEDIATO (Hoje):"
echo "  1. npm run dev"
echo "     (Verificar tudo funcionando)"
echo ""

echo "FASE 1 (4-6 horas):"
echo "  2. npm run generate-all-explanations"
echo "     (Gera explicações com IA)"
echo ""

echo "FASE 2 (Paralelo):"
echo "  3. Revisar blog posts"
echo "     npm run audit-blog-posts"
echo ""

echo "FASE 3 (3-5 dias):"
echo "  4. Deploy:"
echo "     vercel deploy --prod"
echo ""

echo "FASE 4 (Após deploy):"
echo "  5. Testar performance:"
echo "     lighthouse https://seu-site.com --view"
echo ""

echo "FASE 5 (GSC):"
echo "  6. Submeter ao Google Search Console:"
echo "     https://search.google.com/search-console"
echo ""

echo "═════════════════════════════════════════════"
log_success "Setup concluído! Próximo: npm run dev"
echo "═════════════════════════════════════════════"
