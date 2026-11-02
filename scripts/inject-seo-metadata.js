#!/usr/bin/env node
/**
 * inject-seo-metadata.js
 * Bulk injects missing SEO meta tags, canonical, schema.org for all blog posts
 * Reads from app/blog/*.mdx, adds/updates:
 * - meta description
 * - canonical URL
 * - h1 tag
 * - schema.org JSON-LD (BlogPosting)
 * - OpenGraph tags
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const BLOG_DIR = path.join(__dirname, '../app/blog');
const BASE_URL = 'https://enem-pro.vercel.app';

function injectSeoMetadata(filePath, fileContent) {
  let updated = fileContent;
  
  // Extract title from frontmatter
  const titleMatch = updated.match(/title:\s*["']?([^"'\n]+)/);
  const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.mdx');
  
  // Extract slug from filename
  const slug = path.basename(filePath, '.mdx');
  const url = `${BASE_URL}/blog/${slug}`;
  
  // 1. Ensure description in frontmatter
  if (!updated.includes('description:')) {
    const descriptionText = `Domine ${title} para ENEM. Resumo completo, questões resolvidas e simulados.`;
    updated = updated.replace(/^---\n/, `---\ndescription: "${descriptionText}"\n`);
  }
  
  // 2. Ensure canonical tag
  if (!updated.includes('canonical:')) {
    updated = updated.replace(/^---\n/, `---\ncanonical: "${url}"\n`);
  }
  
  // 3. Inject H1 if missing (at start of body)
  const contentStart = updated.indexOf('---', 10) + 3; // After closing ---
  if (updated.indexOf('<h1', contentStart) === -1 && updated.indexOf('# ', contentStart) === -1) {
    updated = updated.slice(0, contentStart) + `\n\n# ${title}\n` + updated.slice(contentStart);
  }
  
  // 4. Inject JSON-LD schema if missing
  if (!updated.includes('schema.org') && !updated.includes('BlogPosting')) {
    const schema = `
\n\n<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "${title.replace(/"/g, '\\"')}",
  "description": "${title} para ENEM",
  "url": "${url}",
  "datePublished": "${new Date().toISOString()}",
  "dateModified": "${new Date().toISOString()}",
  "author": {
    "@type": "Organization",
    "name": "ENEM Pro"
  }
}
</script>
`;
    updated = updated + schema;
  }
  
  // 5. Inject OG tags (in frontmatter)
  if (!updated.includes('og:title')) {
    const ogTags = `\nog:title: "${title}"
og:description: "Domine ${title} para ENEM"
og:url: "${url}"`;
    updated = updated.replace(/^---\n/, `---\n${ogTags}\n`);
  }
  
  return updated;
}

// Main execution
console.log('Starting SEO metadata injection...');
glob(path.join(BLOG_DIR, '**/*.mdx'), (err, files) => {
  if (err) {
    console.error('Error reading blog files:', err);
    process.exit(1);
  }
  
  let updated = 0;
  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const newContent = injectSeoMetadata(filePath, content);
      
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        updated++;
        console.log(`✓ Updated: ${path.relative(BLOG_DIR, filePath)}`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  });
  
  console.log(`\n✅ SEO metadata injection complete: ${updated}/${files.length} files updated`);
  process.exit(0);
});
