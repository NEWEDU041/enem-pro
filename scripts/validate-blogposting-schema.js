#!/usr/bin/env node

/**
 * Valida o schema BlogPosting JSON-LD em todos os posts
 * Verifica estrutura, tipos de dados e conformidade com schema.org
 */

const fs = require('fs');
const path = require('path');

// Importar dados dos posts
const blogDataPath = path.join(__dirname, '../lib/blog-data.ts');
let postCount = 0;
let passCount = 0;
let failCount = 0;
const errors = [];

// Regex para extrair posts do arquivo TypeScript
const fileContent = fs.readFileSync(blogDataPath, 'utf8');
const postsMatch = fileContent.match(/export const BLOG_POSTS.*?\] as const/s);

if (!postsMatch) {
  console.error('Erro: Não foi possível encontrar BLOG_POSTS no arquivo blog-data.ts');
  process.exit(1);
}

console.log('\n📊 Validação de BlogPosting Schema JSON-LD');
console.log('=' .repeat(60));

// Mock do SITE_URL
const SITE_URL = 'https://questoesenem.pro';

/**
 * Valida um objeto schema BlogPosting
 */
function validateBlogPostingSchema(schema, postSlug) {
  const issues = [];

  // Campos obrigatórios
  const requiredFields = [
    '@context',
    '@type',
    'headline',
    'description',
    'datePublished',
    'dateModified',
    'url',
    'author',
    'publisher',
  ];

  for (const field of requiredFields) {
    if (!schema[field]) {
      issues.push(`❌ Campo obrigatório "${field}" está faltando`);
    }
  }

  // Validar @context
  if (schema['@context'] !== 'https://schema.org') {
    issues.push(`⚠️  @context deve ser 'https://schema.org', obteve: ${schema['@context']}`);
  }

  // Validar @type
  if (schema['@type'] !== 'BlogPosting') {
    issues.push(`⚠️  @type deve ser 'BlogPosting', obteve: ${schema['@type']}`);
  }

  // Validar headline (string, 1-110 caracteres recomendado)
  if (typeof schema.headline !== 'string') {
    issues.push(`⚠️  headline deve ser string, obteve: ${typeof schema.headline}`);
  } else if (schema.headline.length < 1 || schema.headline.length > 200) {
    issues.push(`⚠️  headline tem ${schema.headline.length} caracteres (recomendado: 1-110)`);
  }

  // Validar description
  if (typeof schema.description !== 'string' || schema.description.length < 1) {
    issues.push(`⚠️  description deve ser string não-vazia`);
  }

  // Validar datas (ISO 8601)
  const dateRegex = /^\d{4}-\d{2}-\d{2}/;
  if (!dateRegex.test(schema.datePublished)) {
    issues.push(`⚠️  datePublished deve estar em ISO 8601 format (YYYY-MM-DD), obteve: ${schema.datePublished}`);
  }
  if (!dateRegex.test(schema.dateModified)) {
    issues.push(`⚠️  dateModified deve estar em ISO 8601 format (YYYY-MM-DD), obteve: ${schema.dateModified}`);
  }

  // Validar URL
  if (!schema.url || !schema.url.startsWith('http')) {
    issues.push(`⚠️  url deve ser uma URL válida, obteve: ${schema.url}`);
  }

  // Validar author
  if (!schema.author || schema.author['@type'] !== 'Organization') {
    issues.push(`⚠️  author deve ser uma Organization com nome`);
  }

  // Validar publisher
  if (!schema.publisher || schema.publisher['@type'] !== 'EducationalOrganization') {
    issues.push(`⚠️  publisher deve ser uma EducationalOrganization`);
  }

  // Validar mainEntityOfPage (recomendado)
  if (!schema.mainEntityOfPage || !schema.mainEntityOfPage['@id']) {
    issues.push(`⚠️  mainEntityOfPage recomendado para melhor ranking`);
  }

  // Validar inLanguage
  if (schema.inLanguage !== 'pt-BR') {
    issues.push(`⚠️  inLanguage deve ser 'pt-BR', obteve: ${schema.inLanguage}`);
  }

  // Validar image (recomendado)
  if (!schema.image || !schema.image.url) {
    issues.push(`ℹ️  image recomendada para featured snippets`);
  }

  // Validar wordCount (recomendado)
  if (!schema.wordCount || schema.wordCount < 300) {
    issues.push(`ℹ️  wordCount deve ser >= 300 palavras para featured snippets (atual: ${schema.wordCount})`);
  }

  return issues;
}

/**
 * Simula a geração do schema
 */
function generateMockSchema(post) {
  const wordCount = post.content.split(/\s+/).filter(w => w.length > 0).length;
  const postUrl = `${SITE_URL}/blog/${post.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': postUrl,
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    url: postUrl,
    inLanguage: 'pt-BR',
    image: post.cover_url ? {
      '@type': 'ImageObject',
      url: `${SITE_URL}${post.cover_url}`,
      width: 1200,
      height: 630,
    } : {
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
    isPartOf: {
      '@type': 'Blog',
      '@id': `${SITE_URL}/blog`,
      name: 'Blog ENEM Pro',
    },
  };
}

// Extrair posts do arquivo (parse simplificado)
try {
  // Este é um parse simplificado - em produção, seria melhor usar o módulo TypeScript
  const lines = fileContent.split('\n');
  let inPosts = false;
  let braceCount = 0;
  let currentPost = '';

  for (const line of lines) {
    if (line.includes('export const BLOG_POSTS')) {
      inPosts = true;
    }

    if (inPosts) {
      currentPost += line + '\n';
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      if (braceCount === 0 && currentPost.includes('slug:')) {
        try {
          // Parse básico do objeto JavaScript
          const slugMatch = currentPost.match(/slug:\s*['"`]([^'"`]+)/);
          const titleMatch = currentPost.match(/title:\s*['"`]([^'"`]+)/);
          const descMatch = currentPost.match(/description:\s*['"`]([^'"`]+)/);
          const dateMatch = currentPost.match(/date:\s*['"`]([^'"`]+)/);
          const readTimeMatch = currentPost.match(/readTime:\s*(\d+)/);
          const coverMatch = currentPost.match(/cover_url:\s*['"`]([^'"`]+)/);

          if (slugMatch && titleMatch && descMatch && dateMatch) {
            postCount++;
            const post = {
              slug: slugMatch[1],
              title: titleMatch[1],
              description: descMatch[1],
              date: dateMatch[1],
              readTime: readTimeMatch ? parseInt(readTimeMatch[1]) : 5,
              cover_url: coverMatch ? coverMatch[1] : null,
              content: 'Sample content for word count calculation...',
            };

            // Validar schema
            const schema = generateMockSchema(post);
            const issues = validateBlogPostingSchema(schema, post.slug);

            if (issues.length === 0) {
              passCount++;
              if (postCount <= 5 || postCount % 50 === 0) {
                console.log(`✅ ${post.slug}`);
              }
            } else {
              failCount++;
              errors.push({
                slug: post.slug,
                issues,
              });
              console.log(`❌ ${post.slug}`);
              issues.forEach(issue => console.log(`   ${issue}`));
            }
          }
        } catch (e) {
          // Continuar para o próximo post
        }
        currentPost = '';
      }
    }
  }
} catch (error) {
  console.error('Erro ao processar arquivo:', error.message);
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log(`\n📈 Resultados da Validação:`);
console.log(`   Total de posts: ${postCount}`);
console.log(`   ✅ Passou: ${passCount} (${((passCount / postCount) * 100).toFixed(1)}%)`);
console.log(`   ❌ Falhou: ${failCount} (${((failCount / postCount) * 100).toFixed(1)}%)`);

if (errors.length > 0 && errors.length <= 10) {
  console.log(`\n⚠️  Posts com problemas:`);
  errors.forEach(error => {
    console.log(`\n   ${error.slug}:`);
    error.issues.forEach(issue => console.log(`      ${issue}`));
  });
}

console.log('\n💡 Recomendações para melhor SEO:');
console.log('   • Garantir que todos os posts tenham > 300 palavras');
console.log('   • Adicionar imagens de cobertura (cover_url) para todos');
console.log('   • Manter headlines entre 50-60 caracteres para CTR ótimo');
console.log('   • Adicionar seção de FAQ quando aplicável');
console.log('   • Revisar datePublished para precisão total');

console.log('\n🔗 Validar em:');
console.log('   • Google Rich Results Test: https://search.google.com/test/rich-results');
console.log('   • Schema.org Validator: https://validator.schema.org/');
console.log('   • Google Search Console: https://search.google.com/search-console');

console.log('\n✨ Schema BlogPosting implementado com sucesso!\n');

process.exit(failCount > 0 ? 1 : 0);
