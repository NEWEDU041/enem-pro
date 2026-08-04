# Script para validar e fazer deploy após build

echo '✅ Build completado com sucesso!'
echo ''
echo '📋 Próximos passos:'
echo '1. Validar explicações: npm run validate-explanations'
echo '2. Deploy: vercel deploy --prod'
echo '3. Testar performance: lighthouse https://seu-dominio.com'
echo ''
echo 'Ou rodar tudo de uma vez:'
echo 'npm run validate-explanations && vercel deploy --prod && lighthouse https://seu-dominio.com'
