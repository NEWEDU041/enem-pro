#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const SITE_URL = 'https://questoesenem.pro';
const SITEMAPS = [
  `${SITE_URL}/sitemap.xml`,
  `${SITE_URL}/sitemap-posts.xml`,
  `${SITE_URL}/sitemap-static.xml`
];

async function submitSitemap(sitemapUrl, accessToken) {
  return new Promise((resolve, reject) => {
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
    
    const options = {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': 0
      }
    };

    const req = https.request(url, options, (res) => {
      console.log(`✅ ${sitemapUrl} → HTTP ${res.statusCode}`);
      resolve(res.statusCode);
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const token = process.env.GOOGLE_ACCESS_TOKEN;
  
  if (!token) {
    console.log('⚠️  GOOGLE_ACCESS_TOKEN not set');
    console.log('To resubmit sitemaps, run:');
    console.log('  export GOOGLE_ACCESS_TOKEN=$(gcloud auth application-default print-access-token)');
    console.log('  node scripts/resubmit-gsc.js');
    return;
  }

  console.log('📤 Resubmitting sitemaps to Google Search Console...\n');

  for (const sitemap of SITEMAPS) {
    try {
      await submitSitemap(sitemap, token);
    } catch (error) {
      console.error(`❌ ${sitemap}:`, error.message);
    }
  }

  console.log('\n✅ Sitemap resubmission complete');
}

main().catch(console.error);
