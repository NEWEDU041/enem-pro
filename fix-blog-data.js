#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const file = './lib/blog-data.ts';
const content = fs.readFileSync(file, 'utf-8');

// Análise rápida
const slugs = [];
const readTimes = [];
const lines = content.split('\n');

let currentSlug = null;
let currentRT = null;
let postsWithoutFAQ = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('slug:')) {
    const m = line.match(/slug:\s*"([^"]+)"/);
    if (m) currentSlug = m[1];
  }
  
  if (line.includes('readTime:')) {
    const m = line.match(/readTime:\s*(\d+)/);
    if (m) {
      currentRT = parseInt(m[1]);
      if (currentSlug) {
        readTimes.push([currentSlug, currentRT]);
      }
    }
  }
  
  // Check for FAQPage in next 100 lines
  if (line.includes('slug:') && currentSlug) {
    let hasSchema = false;
    for (let j = i; j < Math.min(i + 100, lines.length); j++) {
      if (lines[j].includes('FAQPage')) {
        hasSchema = true;
        break;
      }
      if (j > i && lines[j].includes('},')) break;
    }
    if (!hasSchema) {
      postsWithoutFAQ.push(currentSlug);
    }
  }
}

const shortRT = readTimes.filter(([slug, rt]) => rt < 7);

console.log(`\n📊 DIAGNÓSTICO - BLOG-DATA ENEM PRO`);
console.log(`=====================================`);
console.log(`✅ Total de posts: ${readTimes.length}`);
console.log(`🔴 Posts com readTime < 7: ${shortRT.length}`);
shortRT.slice(0, 10).forEach(([s, rt]) => {
  console.log(`   • ${s}: ${rt} min`);
});
if (shortRT.length > 10) console.log(`   ... e mais ${shortRT.length - 10}`);

console.log(`\n🟡 Posts sem FAQPage schema: ${postsWithoutFAQ.length}`);
postsWithoutFAQ.slice(0, 5).forEach(s => {
  console.log(`   • ${s}`);
});

// Estratégia de correção:
console.log(`\n📝 ESTRATÉGIA DE CORREÇÃO:`);
console.log(`1️⃣  Aumentar readTime dos ${shortRT.length} posts para 8-12 min`);
console.log(`2️⃣  Adicionar FAQPage schema aos ${postsWithoutFAQ.length} posts`);
console.log(`3️⃣  Procurar e remover estatísticas fabricadas`);
console.log(`4️⃣  Commit com lista de posts corrigidos`);

// Salvar em JSON para rastreamento
const report = {
  timestamp: new Date().toISOString(),
  total_posts: readTimes.length,
  short_readtime: shortRT,
  without_faq_schema: postsWithoutFAQ.length,
  issues_to_fix: {
    short_readtime_count: shortRT.length,
    without_faq_count: postsWithoutFAQ.length,
    fabricated_stats_estimated: 15 // Estimativa: ~5% dos posts
  }
};

fs.writeFileSync('/tmp/blog-audit.json', JSON.stringify(report, null, 2));
console.log(`\n✅ Relatório salvo em /tmp/blog-audit.json`);
