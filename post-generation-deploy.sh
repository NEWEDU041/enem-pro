#!/bin/bash

echo "🎉 Explicações geradas! Iniciando validação e deployment..."
echo ""

# Step 1: Validate
echo "📋 Step 1: Validando explicações..."
npm run validate-explanations

if [ $? -ne 0 ]; then
  echo "❌ Validação falhou. Abortando deployment."
  exit 1
fi

echo ""
echo "✅ Validação passou!"
echo ""

# Step 2: Build
echo "🔨 Step 2: Fazendo build..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build falhou. Abortando deployment."
  exit 1
fi

echo ""
echo "✅ Build passou!"
echo ""

# Step 3: Deploy
echo "🚀 Step 3: Deploying para produção..."
vercel deploy --prod --yes

echo ""
echo "✅ Deployment completo!"
echo ""

# Step 4: Summary
echo "📊 RESUMO FINAL"
echo "=============="
echo "✅ Explicações: Todas geradas"
echo "✅ Validação: Passou"
echo "✅ Build: Passou"
echo "✅ Deploy: Enviado"
echo ""
echo "🎯 Próximos passos:"
echo "1. Aguardar deployment da Vercel completar (~5min)"
echo "2. Testar: https://seu-dominio.com"
echo "3. Submeter ao GSC: https://search.google.com/search-console"
echo ""
