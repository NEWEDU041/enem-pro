#!/usr/bin/env node
/**
 * Generate URL list for GSC Indexing API from sitemap
 * Outputs one URL per line to stdout
 */
import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
  const siteUrl = process.env.SITE_URL || 'https://enemprep.com.br';
  const sitemapPath = join(__dirname, '../public/sitemap.xml');
  
  // First try local sitemap file
  let urls = [];
  
  try {
    const sitemapContent = readFileSync(sitemapPath, 'utf-8');
    // Parse XML for URLs
    const urlMatches = sitemapContent.match(/<loc>([^<]+)<\/loc>/g);
    if (urlMatches) {
      urls = urlMatches.map(m => m.replace(/<\/?loc>/g, ''));
    }
  } catch {
    console.log('Local sitemap not found, fetching from production...');
  }
  
  // If no local sitemap, fetch from production
  if (urls.length === 0) {
    try {
      const response = await fetch(`${siteUrl}/sitemap.xml`);
      const content = await response.text();
      const urlMatches = content.match(/<loc>([^<]+)<\/loc>/g);
      if (urlMatches) {
        urls = urlMatches.map(m => m.replace(/<\/?loc>/g, ''));
      }
    } catch (e) {
      console.error('Failed to fetch sitemap:', e.message);
    }
  }
  
  // Filter for blog URLs only (optional - can submit all)
  const blogUrls = urls.filter(u => u.includes('/blog/'));
  
  // Output one per line
  blogUrls.forEach(u => console.log(u));
  
  console.error(`📡 Found ${blogUrls.length} blog URLs from sitemap`);
}

main().catch(console.error);