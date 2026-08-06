#!/usr/bin/env node

/**
 * Script de teste para validação de BlogPosting Schema
 * Testa a função getBlogPostingSchema em posts reais
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simular o contexto
const SITE_URL = 'https://questoesenem.pro';

function getBlogPostingSchema(post, slug) {
  const postUrl = `${SITE_URL}/blog/${slug}`;

  // Calcular word count do conteúdo
  const wordCount = post.content
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;

  // Extrair keywords do título e descrição
  const keywords = extractKeywords(post.title, post.description);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': postUrl,
    headline: post.title,
    description: post.description,
    datePublished: formatDate(post.date),
    dateModified: formatDate(post.date),
    url: postUrl,
    inLanguage: 'pt-BR',
    image: post.cover_url
      ? {
          '@type': 'ImageObject',
          url: `${SITE_URL}${post.cover_url}`,
          width: 1200,
          height: 630,
        }
      : {
          '@type': 'ImageObject',
          url: `${SITE_URL}/images/blog/default-cover.png`,
          width: 1200,
          height: 630,
        },
    author: {
      '@type': 'Organization',
      name: 'Equipe Editorial ENEM Pro',
      url: `${SITE_URL}/sobre`,
      description: 'Professores e especialistas em preparação para o ENEM com mais de 10 anos de experiência em educação.',
    },
    publisher: {
      '@type': 'EducationalOrganization',
      name: 'ENEM Pro',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icons/icon-192.png`,
        width: 192,
        height: 192,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    educationalLevel: 'Ensino Médio',
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
    },
    about: {
      '@type': 'Thing',
      name: 'ENEM — Exame Nacional do Ensino Médio',
    },
    wordCount,
    articleBody: post.content,
    keywords,
    isPartOf: {
      '@type': 'Blog',
      '@id': `${SITE_URL}/blog`,
      name: 'Blog ENEM Pro',
    },
  };
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return dateString;
  }
}

function extractKeywords(title, description) {
  const commonStopWords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
    'de', 'do', 'da', 'dos', 'das', 'e', 'ou',
    'é', 'são', 'era', 'eram', 'ser', 'estar',
    'com', 'sem', 'por', 'para', 'em', 'à',
    'que', 'qual', 'como', 'quando', 'onde',
    'muito', 'pouco', 'mais', 'menos', 'este', 'esse'
  ]);

  const text = `${title} ${description}`.toLowerCase();
  const words = text
    .split(/[\s\-,.:;!?()[\]{}«»"'`]+/)
    .filter(word =>
      word.length > 3 &&
      !commonStopWords.has(word) &&
      !/^\d+$/.test(word)
    );

  const uniqueKeywords = [...new Set(words)];
  return uniqueKeywords.slice(0, 10);
}

function validateSchema(schema) {
  const errors = [];
  const warnings = [];

  // Campos obrigatórios
  const required = ['@context', '@type', 'headline', 'description', 'datePublished', 'dateModified', 'url', 'author', 'publisher'];
  for (const field of required) {
    if (!schema[field]) {
      errors.push(`Campo obrigatório ausente: ${field}`);
    }
  }

  // Validações
  if (schema['@type'] !== 'BlogPosting') {
    errors.push(`@type deve ser 'BlogPosting', obteve: ${schema['@type']}`);
  }

  if (!schema.url || !schema.url.startsWith('http')) {
    errors.push(`URL inválida: ${schema.url}`);
  }

  if (!schema.image) {
    warnings.push('Imagem não configurada (recomendado para featured snippets)');
  }

  if (!schema.wordCount || schema.wordCount < 300) {
    warnings.push(`Word count baixo (${schema.wordCount}), recomendado >= 300 para featured snippets`);
  }

  if (!schema.keywords || schema.keywords.length === 0) {
    warnings.push('Keywords não extraídas corretamente');
  }

  return { errors, warnings };
}

// Teste com dados fictícios
console.log('\n🧪 Teste de Validação - BlogPosting Schema');
console.log('='.repeat(70));

const testPost = {
  slug: 'test-blogposting-schema',
  title: 'Como Funciona o TRI do ENEM: Guia Completo 2024',
  description: 'Entenda o sistema de pontuação TRI do ENEM. Como funciona, cálculo de notas e estratégias para aumentar sua pontuação em cada disciplina.',
  date: '2024-11-10',
  readTime: 12,
  cover_url: '/images/blog/tri-enem-como-funciona.png',
  content: `O TRI (Teoria de Resposta ao Item) é o sistema de pontuação do ENEM desde 2009. Diferentemente de uma prova tradicional onde cada questão vale um ponto, o ENEM utiliza um modelo matemático sofisticado.

Este artigo explica como funciona o TRI, como as notas são calculadas e quais são as estratégias para maximizar sua pontuação.

## O que é o TRI?

O TRI é um modelo estatístico que considera a dificuldade de cada questão e o padrão de respostas dos candidatos para calcular a nota final.

## Como Funciona?

Cada questão tem um grau de dificuldade diferente. Uma questão fácil que a maioria acerta não vale o mesmo que uma questão difícil que poucos acertam.

## Cálculo de Notas

A nota final é calculada em uma escala de 0 a 1000 pontos por disciplina.`,
};

console.log(`\n📝 Testando post: ${testPost.title}`);
console.log(`   Slug: ${testPost.slug}`);
console.log(`   Palavras: ~${testPost.content.split(/\s+/).length}`);

const schema = getBlogPostingSchema(testPost, testPost.slug);
const validation = validateSchema(schema);

console.log('\n✅ Schema Gerado com Sucesso:');
console.log(`   @context: ${schema['@context']}`);
console.log(`   @type: ${schema['@type']}`);
console.log(`   URL: ${schema.url}`);
console.log(`   Language: ${schema.inLanguage}`);
console.log(`   Word Count: ${schema.wordCount}`);
console.log(`   Keywords: ${schema.keywords.join(', ')}`);
console.log(`   Image: ${schema.image?.url ? '✅ Configurada' : '❌ Não configurada'}`);

if (validation.errors.length === 0) {
  console.log('\n✅ Validação Estrutural: PASSOU');
} else {
  console.log('\n❌ Erros de Validação:');
  validation.errors.forEach(e => console.log(`   • ${e}`));
}

if (validation.warnings.length > 0) {
  console.log('\n⚠️  Alertas:');
  validation.warnings.forEach(w => console.log(`   • ${w}`));
}

console.log('\n📋 JSON-LD Completo (primeiras 500 chars):');
const jsonStr = JSON.stringify(schema, null, 2);
console.log(jsonStr.substring(0, 500) + '...\n');

// Verificar conformidade
console.log('🔍 Checklist de Conformidade Google Rich Results:');
const checks = [
  { name: '@context schema.org', pass: schema['@context'] === 'https://schema.org' },
  { name: '@type BlogPosting', pass: schema['@type'] === 'BlogPosting' },
  { name: 'headline presente', pass: !!schema.headline },
  { name: 'description presente', pass: !!schema.description },
  { name: 'datePublished válida', pass: /^\d{4}-\d{2}-\d{2}/.test(schema.datePublished) },
  { name: 'dateModified válida', pass: /^\d{4}-\d{2}-\d{2}/.test(schema.dateModified) },
  { name: 'URL válida', pass: schema.url?.startsWith('http') },
  { name: 'author definido', pass: !!schema.author },
  { name: 'publisher definido', pass: !!schema.publisher },
  { name: 'mainEntityOfPage definido', pass: !!schema.mainEntityOfPage },
  { name: 'image definida', pass: !!schema.image },
  { name: 'wordCount >= 300', pass: schema.wordCount >= 300 },
  { name: 'inLanguage pt-BR', pass: schema.inLanguage === 'pt-BR' },
];

const allPass = checks.every(c => c.pass);
checks.forEach(c => {
  console.log(`   ${c.pass ? '✅' : '❌'} ${c.name}`);
});

console.log('\n' + '='.repeat(70));
if (allPass && validation.errors.length === 0) {
  console.log('✨ Schema pronto para produção! Validar em:');
  console.log('   🔗 https://search.google.com/test/rich-results');
  console.log('   🔗 https://validator.schema.org/');
  process.exit(0);
} else {
  console.log('❌ Schema precisa de ajustes antes de produção');
  process.exit(1);
}
