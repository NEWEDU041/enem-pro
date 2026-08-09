
# CONFIGURAÇÃO DE GOOGLE ANALYTICS - PASSO A PASSO

## 1. Criar Propriedade GA4

1. Acesse: https://analytics.google.com
2. Faça login com sua conta Google
3. Clique em "Criar propriedade"
4. Nome: "ENEM Pro - Blog"
5. Timezone: "Brasília (UTC-3)"
6. Moeda: "BRL"
7. Selecione "Web"

## 2. Registrar o Site

1. Nome de fluxo de dados: "questoesenem.pro"
2. URL: https://questoesenem.pro
3. Clique em "Criar fluxo"
4. Copie o "Measurement ID" (formato: G-XXXXXXXX)

## 3. Configurar no Projeto

1. Abra: .env.production.local
2. Adicione:
   NEXT_PUBLIC_GA_ID=G-XXXXXXXX (Cole o ID que você copiou)

3. Abra: app/layout.tsx
4. Adicione no <head>:
   <Analytics />

5. Crie: app/components/Analytics.tsx
6. Cole o código de ANALYTICS-IMPLEMENTATION.tsx

## 4. Deploy

1. Commit as mudanças:
   git add .env.production.local app/components/Analytics.tsx app/layout.tsx
   git commit -m "🔧 Google Analytics setup"

2. Deploy para Vercel

## 5. Testar

1. Abra: https://questoesenem.pro
2. Instale: Google Analytics Debugger (extensão Chrome)
3. Abra DevTools (F12)
4. Vá para aba "Google Analytics"
5. Verifique se eventos estão sendo disparados

## 6. Monitorar

1. Volte para Google Analytics
2. Seção "Realtime" → veja visitantes em tempo real
3. Aguarde 24h para dados históricos aparecerem

## Métricas Importantes

- **Usuários**: Número de visitantes únicos
- **Sessões**: Número de visitas
- **Duração média**: Tempo médio no site
- **Taxa de rejeição**: % usuários que saem sem interagir
- **Conversões**: Cliques em CTAs
- **Engajamento**: Scroll depth, tempo lido, etc

## Onde Acompanhar

- Realtime: Visitantes agora
- Audience: Quem está visitando
- Traffic Sources: De onde viêm os visitantes
- Content: Quais posts mais acessados
- Engagement: Como interagem com o site

## Próximos Passos

1. Setup: ~5 minutos
2. Primeiro deploy: ~2 minutos
3. Primeira visualização: ~24 horas
4. Análise de dados: ~2 semanas

Boa sorte! 🚀
