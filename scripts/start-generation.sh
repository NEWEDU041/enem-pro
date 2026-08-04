#!/bin/bash
# 🚀 Script para iniciar geração de explicações com logging

set -e

echo "📊 ENEM Pro - Início de Geração de Explicações"
echo "=============================================="
echo "Data: $(date)"
echo "Diretório: $(pwd)"
echo ""

# Verificar variáveis de ambiente
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "❌ ERRO: ANTHROPIC_API_KEY não está definida"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ ERRO: Variáveis Supabase não estão definidas"
  exit 1
fi

echo "✅ Variáveis de ambiente: OK"
echo ""

# Criar diretório de logs
mkdir -p logs
LOG_FILE="logs/generation-$(date +%Y%m%d-%H%M%S).log"

echo "📝 Logs serão salvos em: $LOG_FILE"
echo ""

# Começar geração
echo "⏳ Iniciando geração de explicações..."
echo "   Você pode acompanhar o progresso em: tail -f $LOG_FILE"
echo ""

npx ts-node scripts/generate-all-explanations.ts | tee "$LOG_FILE" &
PID=$!

echo "🔄 Processo iniciado com PID: $PID"
echo ""
echo "Para parar o processo: kill $PID"
echo "Para ver progresso: tail -f $LOG_FILE"
echo ""

wait $PID
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Geração concluída com sucesso!"
else
  echo "❌ Geração falhou com código: $EXIT_CODE"
fi

exit $EXIT_CODE
