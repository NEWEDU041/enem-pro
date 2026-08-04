# 🔗 Guia Setup Google Search Console (GSC)

## Passo 1: Preparar Arquivos ✅

- ✅ `public/robots.txt` - Criado
- ✅ `public/sitemap.xml` - Criado
- ✅ `next.config.js` - Configurado com cache headers

## Passo 2: Deploy em Produção

```bash
# Build
npm run build

# Vercel (recomendado)
vercel deploy --prod

# OU Netlify
netlify deploy --prod
```

## Passo 3: Adicionar Propriedade no GSC

1. **Abrir:** https://search.google.com/search-console
2. **Nova propriedade:** `https://seu-dominio.com`
3. **Verificar:** Baixar HTML file e colocar em `public/`
4. **OU:** Usar DNS TXT record
5. **Confirmar verificação**

## Passo 4: Submeter Sitemap

1. **No GSC → Sitemaps**
2. **Add new sitemap:** `sitemap.xml`
3. **Submit**
4. **Aguardar 24-48h para indexação**

## Passo 5: Verificar Coverage

```
No GSC → Coverage

Verificar:
✅ Submitted and indexed = URLs funcionando
⏳ Submitted but not indexed = Esperar 48h
⚠️ Discovered but not indexed = Revisar conteúdo
❌ Errors = Corrigir issues
```

## Passo 6: Monitorar Performance

```
No GSC → Performance

Acompanhar:
- Click-through rate (CTR)
- Average position no Google
- Impressions
- Cliques
```

## Passo 7: Mobile Usability

```
No GSC → Mobile Usability

Garantir:
✅ Sem erros
✅ Sem avisos
✅ Texto legível
✅ Elementos tappable
```

## URLs Recomendadas para Indexar

Adicionar manualmente (GSC → URL Inspection → Request Indexing):

```
https://seu-site.com/
https://seu-site.com/questoes
https://seu-site.com/simulado
https://seu-site.com/blog
https://seu-site.com/calcular-nota
https://seu-site.com/dashboard
https://seu-site.com/planos
```

## Dicas Rápidas

1. **Submeter novo conteúdo:**
   - Blog posts novos
   - Páginas importantes
   - Alterações em URLs

2. **Monitorar regularmente:**
   - Weekly: Ver performance
   - Monthly: Analisar trends
   - Daily: Verificar erros

3. **Melhorar ranking:**
   - Core Web Vitals > 80
   - Mais conteúdo relevante
   - Links internos estratégicos
   - Schema markup correto

## ✅ Checklist Final

- [ ] Domínio verificado no GSC
- [ ] Sitemap submetido
- [ ] Coverage: 100% indexed
- [ ] Mobile usability: OK
- [ ] Core Web Vitals: Green
- [ ] Sem erros de crawl
- [ ] Recebendo impressões no Google
