#!/usr/bin/env node

/**
 * Generate sitemap index for large blog
 * Splits: sitemap-posts.xml + sitemap-static.xml
 * Runs automatically during build
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://questoesenem.pro';
const PUBLIC_DIR = path.join(__dirname, '../public');

function generateSitemapIndex() {
  const sitemaps = [
    { loc: `${SITE_URL}/sitemap-posts.xml`, priority: 'high' },
    { loc: `${SITE_URL}/sitemap-static.xml`, priority: 'medium' }
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(s => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), xml);
  console.log('✅ Sitemap index generated');
}

// Generate posts sitemap (dynamic)
function generatePostsSitemap() {
  try {
    const blogData = require('../lib/blog-data.ts');
    const posts = blogData.posts || [];

    const urls = posts
      .slice(0, 50000) // Google limit
      .map(post => `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${post.date || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-posts.xml'), xml);
    console.log(`✅ Posts sitemap generated (${posts.length} posts)`);
  } catch (e) {
    console.log('⚠️  Skipping posts sitemap (blog-data not available yet)');
  }
}

// Generate static sitemap
function generateStaticSitemap() {
  const urls = [
    { loc: SITE_URL, priority: 1.0, changefreq: 'daily' },
    { loc: `${SITE_URL}/blog`, priority: 0.9, changefreq: 'daily' },
    { loc: `${SITE_URL}/sobre`, priority: 0.7, changefreq: 'monthly' },
    { loc: `${SITE_URL}/contato`, priority: 0.6, changefreq: 'monthly' },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-static.xml'), xml);
  console.log('✅ Static sitemap generated');
}

// Run all
generatePostsSitemap();
generateStaticSitemap();
generateSitemapIndex();
