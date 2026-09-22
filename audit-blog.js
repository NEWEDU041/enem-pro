#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Ler blog-data.ts
const dataFile = fs.readFileSync(path.join(__dirname, 'lib/blog-data.ts'), 'utf-8');

// Extrair BLOG_POSTS array usando regex
const postsMatch = dataFile.match(/export const BLOG_POSTS: BlogPost\[\] = \[([\s\S]*?)\n\]/);
if (!postsMatch) {
  console.error('❌ Não conseguiu extrair BLOG_POSTS');
  process.exit(1);
}

// Parse manual dos posts (uma vez que é um array literal TS)
// Usar eval com cuidado (NUNCA em produção)
const postsCode = `const BLOG_POSTS = [${postsMatch[1]}\n]`;
const posts = eval(`(function() { ${postsCode}; return BLOG_POSTS; })()`);

// Métricas
let stats = {
  total: posts.length,
  readTime7Plus: 0,
  score80Plus: 0,
  words1500Plus: 0,
  hasBlogPostingSchema: 0,
  hasFaqSchema: 0,
  noindex: 0,
};

let postsBelow80 = [];
let postsBelow1500 = [];
let postsBelow7Min = [];
let postsNoFaq = [];
let postsNoBlogPosting = [];

posts.forEach((post, idx) => {
  // Métricas básicas
  const readTime = post.readTime || 0;
  const score = post.score || 0;
  const wordCount = (post.content || '').split(/\s+/).length;
  const hasBlogPosting = post.content && post.content.includes('"@type": "BlogPosting"');
  const hasFaq = post.content && post.content.includes('"@type": "FAQPage"');

  if (readTime >= 7) stats.readTime7Plus++;
  if (score >= 80) stats.score80Plus++;
  if (wordCount >= 1500) stats.words1500Plus++;
  if (hasBlogPosting) stats.hasBlogPostingSchema++;
  if (hasFaq) stats.hasFaqSchema++;
  if (post.noindex) stats.noindex++;

  if (score < 80) postsBelow80.push({ idx, score, title: post.title, slug: post.slug });
  if (wordCount < 1500) postsBelow1500.push({ idx, wordCount, title: post.title, slug: post.slug });
  if (readTime < 7) postsBelow7Min.push({ idx, readTime, title: post.title, slug: post.slug });
  if (!hasFaq) postsNoFaq.push({ idx, title: post.title, slug: post.slug });
  if (!hasBlogPosting) postsNoBlogPosting.push({ idx, title: post.title, slug: post.slug });
});

// Gerar relatório
console.log('\n📊 AUDITORIA COMPLETA ENEM PRO');
console.log('============================\n');

console.log('✅ SUMÁRIO:');
console.log(`   Total de posts: ${stats.total}`);
console.log(`   Com readTime >= 7: ${stats.readTime7Plus} (${(100 * stats.readTime7Plus / stats.total).toFixed(1)}%)`);
console.log(`   Com score >= 80: ${stats.score80Plus} (${(100 * stats.score80Plus / stats.total).toFixed(1)}%)`);
console.log(`   Com wordCount >= 1500: ${stats.words1500Plus} (${(100 * stats.words1500Plus / stats.total).toFixed(1)}%)`);
console.log(`   Com BlogPosting schema: ${stats.hasBlogPostingSchema} (${(100 * stats.hasBlogPostingSchema / stats.total).toFixed(1)}%)`);
console.log(`   Com FAQPage schema: ${stats.hasFaqSchema} (${(100 * stats.hasFaqSchema / stats.total).toFixed(1)}%)`);
console.log(`   Marcados noindex: ${stats.noindex}`);

console.log('\n🔴 PROBLEMAS IDENTIFICADOS:');
console.log(`   Posts com score < 80: ${postsBelow80.length}`);
console.log(`   Posts com < 1500 palavras: ${postsBelow1500.length}`);
console.log(`   Posts com < 7 min readTime: ${postsBelow7Min.length}`);
console.log(`   Posts sem FAQPage schema: ${postsNoFaq.length}`);
console.log(`   Posts sem BlogPosting schema: ${postsNoBlogPosting.length}`);

// Salvar detalhes em JSON
const issues = {
  timestamp: new Date().toISOString(),
  stats,
  postsBelow80: postsBelow80.slice(0, 50), // Primeiros 50
  postsBelow1500: postsBelow1500.slice(0, 50),
  postsBelow7Min: postsBelow7Min.slice(0, 50),
  postsNoFaq: postsNoFaq.slice(0, 50),
  postsNoBlogPosting: postsNoBlogPosting.slice(0, 50),
};

fs.writeFileSync(
  path.join(__dirname, 'audit-report.json'),
  JSON.stringify(issues, null, 2)
);

console.log('\n💾 Relatório salvo em: audit-report.json\n');

// Detalhes
if (postsBelow80.length > 0) {
  console.log('⚠️  POSTS COM SCORE < 80 (primeiros 10):');
  postsBelow80.slice(0, 10).forEach(p => {
    console.log(`   [${p.idx}] "${p.slug}" (score: ${p.score})`);
  });
  console.log(`   ... e mais ${Math.max(0, postsBelow80.length - 10)}\n`);
}

if (postsBelow1500.length > 0) {
  console.log('⚠️  POSTS COM < 1500 PALAVRAS (primeiros 10):');
  postsBelow1500.slice(0, 10).forEach(p => {
    console.log(`   [${p.idx}] "${p.slug}" (${p.wordCount} palavras)`);
  });
  console.log(`   ... e mais ${Math.max(0, postsBelow1500.length - 10)}\n`);
}

if (postsBelow7Min.length > 0) {
  console.log('⚠️  POSTS COM < 7 MIN READTIME (primeiros 10):');
  postsBelow7Min.slice(0, 10).forEach(p => {
    console.log(`   [${p.idx}] "${p.slug}" (${p.readTime} min)`);
  });
  console.log(`   ... e mais ${Math.max(0, postsBelow7Min.length - 10)}\n`);
}

if (postsNoFaq.length > 0) {
  console.log('⚠️  POSTS SEM FAQPAGE SCHEMA (primeiros 10):');
  postsNoFaq.slice(0, 10).forEach(p => {
    console.log(`   [${p.idx}] "${p.slug}"`);
  });
  console.log(`   ... e mais ${Math.max(0, postsNoFaq.length - 10)}\n`);
}
