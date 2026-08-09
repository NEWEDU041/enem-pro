#!/usr/bin/env node
/**
 * Extrair e restaurar 292 posts do backup git
 */

const fs = require('fs');
const path = require('path');

const backupFile = path.join(__dirname, '../blog-data-292posts-backup.ts');
const fullContent = fs.readFileSync(backupFile, 'utf-8');

// Encontrar array
const arrayStart = fullContent.indexOf('export const BLOG_POSTS: BlogPost[] = [');
const arrayEnd = fullContent.lastIndexOf('];');

if (arrayStart === -1 || arrayEnd === -1) {
  console.error('❌ Não encontrado array BLOG_POSTS');
  process.exit(1);
}

const arrayContent = fullContent.substring(arrayStart + 39, arrayEnd);

// Split por objetos { ... }
const posts = {};
let braceLevel = 0;
let currentObj = '';

for (let i = 0; i < arrayContent.length; i++) {
  const char = arrayContent[i];

  if (char === '{') braceLevel++;
  if (char === '}') braceLevel--;

  currentObj += char;

  if (braceLevel === 0 && currentObj.includes('{')) {
    // Completamos um objeto
    try {
      // Extrair slug
      const slugMatch = currentObj.match(/slug:\s*['"]([^'"]*)['"]/);
      if (slugMatch) {
        const slug = slugMatch[1];

        // Extrair campos
        const titleMatch = currentObj.match(/title:\s*['"]([^'"]*)['"]/);
        const descMatch = currentObj.match(/description:\s*['"]([^'"]*)['"]/);
        const dateMatch = currentObj.match(/date:\s*['"]([^'"]*)['"]/);
        const readTimeMatch = currentObj.match(/readTime:\s*(\d+)/);

        // Extrair content (pode ter backticks ou aspas)
        let content = '';
        const backticksMatch = currentObj.match(/content:\s*`([^`]*)`/);
        if (backticksMatch) {
          content = backticksMatch[1];
        } else {
          const quoteMatch = currentObj.match(/content:\s*['"]([^'"]*)['"]/);
          if (quoteMatch) {
            content = quoteMatch[1];
          }
        }

        posts[slug] = {
          slug: slug,
          title: titleMatch ? titleMatch[1].replace(/\\"/g, '"') : '',
          description: descMatch ? descMatch[1].replace(/\\"/g, '"') : '',
          date: dateMatch ? dateMatch[1] : '',
          readTime: readTimeMatch ? parseInt(readTimeMatch[1]) : 0,
          content: content.replace(/\\n/g, '\n')
        };
      }
    } catch (e) {
      // Ignorar erros de parsing individual
    }

    currentObj = '';
  }
}

console.log(`✅ Posts extraídos: ${Object.keys(posts).length}`);

if (Object.keys(posts).length === 0) {
  console.error('❌ Nenhum post encontrado');
  process.exit(1);
}

// Salvar JSON
const outputFile = path.join(__dirname, '../restored-292-posts.json');
fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2), 'utf-8');
console.log(`✅ Salvo em: ${outputFile}`);

// Listar primeiros 5
console.log('\nPrimeiros 5 posts restaurados:');
const entries = Object.entries(posts).slice(0, 5);
entries.forEach(([slug, data], i) => {
  console.log(`  ${i+1}. ${slug}`);
  console.log(`     ${data.title.substring(0, 60)}...`);
});

console.log(`\n✅ Total de posts: ${Object.keys(posts).length}`);
