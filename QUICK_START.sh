#!/bin/bash

# ⚡ QUICK START - EXECUTE PARA COMEÇAR TUDO AGORA!

echo "🚀 ENEM Pro - Transformação Completa"
echo "===================================="
echo ""

# Verificar se está no diretório certo
if [ ! -f "package.json" ]; then
  echo "❌ Erro: Execute este script no diretório do projeto"
  echo "   cd C:/Projetos/enem-pro"
  exit 1
fi

echo "✅ Diretório correto: $(pwd)"
echo ""

# Menu de opções
echo "📋 Escolha o que fazer:"
echo ""
echo "1) Verificar status de explicações"
echo "2) Gerar explicações faltando"
echo "3) Auditar blog posts"
echo "4) Testar performance (Lighthouse)"
echo "5) Build para produção"
echo "6) Tudo (1 + 2 + 3)"
echo ""
read -p "Digite o número (1-6): " choice

case $choice in
  1)
    echo "🔍 Verificando explicações..."
    npm run check-explanations
    ;;
  2)
    echo "⚙️  Começando geração de explicações..."
    echo "   Isso pode levar 4-6 horas"
    echo ""
    npm run generate-all-explanations
    ;;
  3)
    echo "📰 Auditando blog posts..."
    npm run audit-blog-posts
    ;;
  4)
    echo "📊 Instalando Lighthouse..."
    npm install -g lighthouse
    echo ""
    echo "Entrar com URL (ex: https://seu-site.com):"
    read -p "URL: " url
    if [ -z "$url" ]; then
      url="http://localhost:3000"
    fi
    echo "🔦 Testando $url..."
    lighthouse "$url" --view
    ;;
  5)
    echo "🔨 Building para produção..."
    npm run build
    echo ""
    echo "✅ Build concluído!"
    echo "   Próximo: Deploy com 'vercel deploy --prod'"
    ;;
  6)
    echo "🚀 Executando tudo..."
    echo ""
    echo "1️⃣  Verificando status..."
    npm run check-explanations
    echo ""
    echo "2️⃣  Auditando blog..."
    npm run audit-blog-posts
    echo ""
    echo "3️⃣  Começando geração..."
    echo "   ⚠️  AVISO: Isso vai levar 4-6 horas!"
    read -p "Continuar? (s/n): " confirm
    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
      npm run generate-all-explanations
    fi
    ;;
  *)
    echo "❌ Opção inválida"
    exit 1
    ;;
esac

echo ""
echo "✅ Concluído!"
