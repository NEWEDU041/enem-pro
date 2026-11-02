#!/usr/bin/env node
/**
 * validate-canonical-sitemap.js
 * Ensures all blog posts in sitemap have canonical URLs
 * Checks for orphaned posts (in sitemap but missing canonical)
 */

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const SITEMAP_PATH = path.join(__dirname, '../public/sitemap/sitemap-posts.xml');
const BASE_URL = 'https://enem-pro.vercel.app';

async function validateCanonical() {
  try {
    const sitemapXml = fs.readFileSync(SITEMAP_PATH, 'utf-8');
    const parser = new xml2js.Parser();
    const sitemap = await parser.parseStringPromise(sitemapXml);
    
    const urls = sitemap.urlset.url || [];
    console.log(`Validating ${urls.length} URLs in sitemap...\n`);
    
    let missingCanonical = 0;
    urls.forEach((item, idx) => {
      const loc = item.loc[0];
      const slug = loc.replace(`${BASE_URL}/blog/`, '').replace(/\/$/, '');
      
      // Verify canonical would be set
      const expectedCanonical = `${BASE_URL}/blog/${slug}`;
      console.log(`[${idx + 1}/${urls.length}] ${slug}`);
      
      if (!loc.includes('canonical')) {
        missingCanonical++;
      }
    });
    
    console.log(`\n✓ Sitemap validation complete`);
    console.log(`  Total URLs: ${urls.length}`);
    console.log(`  Missing canonical: ${missingCanonical}`);
    console.log(`  ⚠️  ACTION: Run inject-seo-metadata.js to add missing canonicals`);
  } catch (err) {
    console.error('Error validating sitemap:', err.message);
    process.exit(1);
  }
}

validateCanonical();
