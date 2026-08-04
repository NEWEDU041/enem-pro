# 🚀 Setup GSC — Guia Passo a Passo

**Tempo estimado**: 10 minutos

---

## Passo 1: Criar Google Service Account (5 min)

### 1.1 Ir para Google Cloud Console
👉 https://console.cloud.google.com

### 1.2 Criar novo projeto
1. Click "Create Project"
2. Nome: `ENEM Pro GSC`
3. Click "Create"

### 1.3 Ativar APIs
1. Buscar: `Google Search Console API`
2. Click no resultado → Click "Enable"
3. Buscar: `Google Indexing API`
4. Click no resultado → Click "Enable"

### 1.4 Criar Service Account
1. Left sidebar → "Service Accounts"
2. Click "Create Service Account"
3. Service account name: `enem-pro-monitoring`
4. Description: `Monitor ENEM Pro GSC`
5. Click "Create and Continue"
6. Click "Continue" (roles é opcional por enquanto)
7. Click "Done"

### 1.5 Gerar JSON Key
1. Procure a service account que criou (`enem-pro-monitoring`)
2. Click na aba "Keys"
3. Click "Add Key" → "Create new key"
4. Escolha "JSON"
5. **IMPORTANTE**: Salve este arquivo JSON em lugar seguro!

---

## Passo 2: Adicionar Service Account ao Google Search Console (3 min)

### 2.1 Ir para GSC
👉 https://search.google.com/search-console

### 2.2 Selecione propriedade `questoesenem.pro`
1. Click em `questoesenem.pro` na lista

### 2.3 Adicionar usuário
1. Left sidebar → "Settings" (engrenagem)
2. Click "Users and Permissions"
3. Click "Add User"
4. Cole o **email do service account** (do JSON file, campo `client_email`)
5. Escolha role: "Editor"
6. Click "Add"

### 2.4 Verificar Sitemap
1. Left sidebar → "Sitemaps"
2. Procure `https://questoesenem.pro/sitemap.xml`
3. Se não estiver lá, click "Add/test sitemap" e adicione
4. Se estiver lá e marcado ✅, perfeito!

---

## Passo 3: Configurar Vercel (2 min)

### 3.1 Abrir Vercel Dashboard
👉 https://vercel.com/tevez041041-9726s-projects/enem-pro/settings/environment-variables

### 3.2 Adicionar Variável 1: GOOGLE_SERVICE_ACCOUNT_KEY
1. Click "Add New" → "Environment Variable"
2. **Name**: `GOOGLE_SERVICE_ACCOUNT_KEY`
3. **Value**: Abra o JSON que baixou do Google Cloud
   - Selecione TODO o conteúdo (Ctrl+A)
   - Copie (Ctrl+C)
   - Cole no campo "Value"
4. **Environments**: Marque apenas "Production"
5. Click "Save"

### 3.3 Adicionar Variável 2: CRON_SECRET
1. Click "Add New" → "Environment Variable"
2. **Name**: `CRON_SECRET`
3. **Value**: Gere um token aleatório:
   - Abra terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Copie a saída
   - Cole no campo "Value"
4. **Environments**: Marque apenas "Production"
5. Click "Save"

---

## Passo 4: Deploy (1 min)

### 4.1 Terminal
```bash
cd C:\projetos\enem-pro
vercel --prod
```

### 4.2 Aguarde completar
Deploy deve levar ~2 minutos. Quando terminar, verá:
```
✅ Deployment completed
▲ Aliased https://questoesenem.pro
```

---

## Passo 5: Validar Setup (1 min)

### 5.1 Rodar script de validação (local)
```bash
cd C:\projetos\enem-pro
npx ts-node scripts/setup-gsc-complete.ts
```

### 5.2 Verificar output
Deve mostrar:
- ✅ GOOGLE_SERVICE_ACCOUNT_KEY loaded
- ✅ Google Auth client initialized
- ✅ GSC cron is configured

---

## Passo 6: Monitorar Resultados (Ongoing)

### 6.1 Primeira execução
- O cron roda **toda segunda-feira às 9 AM UTC**
- Se for hoje segunda, vai rodar em ~24h
- Para forçar execução (dev):
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" \
    https://questoesenem.pro/api/cron/gsc-weekly-report
  ```

### 6.2 Verificar relatórios
- Relatórios aparecem em `C:\projetos\enem-pro\.gsc-reports\`
- Formato: `gsc-report-YYYY-MM-DD-wNN.json` + `.md`

### 6.3 Ver dados reais no GSC
👉 https://search.google.com/search-console/property/questoesenem.pro/performance

Métricas esperadas em 48-72h:
- **Impressions**: Número de vezes que URL apareceu em search results
- **Clicks**: Número de cliques
- **Average Position**: Posição média (≤20 é bom)
- **Click-through Rate (CTR)**: % de clicks/impressions

---

## ❓ Troubleshooting

### "GOOGLE_SERVICE_ACCOUNT_KEY not set"
→ Verifique que a variável foi salva em Vercel → Settings → Environment Variables
→ Redeploy: `vercel --prod`

### "No page data returned from GSC API"
→ Service account email foi adicionado ao GSC com permissão "Editor"?
→ Aguarde 15 minutos após adicionar o usuário (GSC precisa sincronizar)
→ Teste acesso direto ao GSC manualmente com outro browser

### "GSC property questoesenem.pro not verified"
→ Ir para https://search.google.com/search-console
→ Procurar `questoesenem.pro` na lista
→ Se não estiver, adicione manualmente (HTML file upload ou DNS)

---

## ✅ Checklist Final

- [ ] Google Service Account criado
- [ ] Service Account JSON baixado e salvo
- [ ] Google Search Console API ativada
- [ ] Google Indexing API ativada
- [ ] Service account adicionado ao GSC (com email certo, role "Editor")
- [ ] GOOGLE_SERVICE_ACCOUNT_KEY configurado em Vercel
- [ ] CRON_SECRET configurado em Vercel
- [ ] Deploy realizado (vercel --prod)
- [ ] Validation script rodou sem erros (npx ts-node scripts/setup-gsc-complete.ts)
- [ ] Sitemap submetido no GSC (https://questoesenem.pro/sitemap.xml)

---

## 🎉 Quando tudo estiver pronto

1. Cron vai rodar toda segunda 9 AM UTC
2. Relatórios aparecem em `.gsc-reports/`
3. Dados reais do GSC aparecem em 48-72h
4. Monitore: https://search.google.com/search-console/property/questoesenem.pro/performance

**Sua próxima tarefa: Podar + reescrever os 300 blog posts (veja BLOG_CLEANUP_REPORT.md)**

---

**Dúvidas?** Leia IMPROVEMENT_SUMMARY.md para contexto completo
