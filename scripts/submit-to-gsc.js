#!/usr/bin/env node
/**
 * Submit URLs to Google Search Console Indexing API
 * Reads URLs from stdin (one per line) or from file argument
 */
import { readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';

async function main() {
  const credsPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || 'sa-key.json';
  
  if (!require('fs').existsSync(credsPath)) {
    console.error('❌ Credentials file not found:', credsPath);
    process.exit(1);
  }

  // Read URLs from stdin or file
  let urls = [];
  const inputFile = process.argv[2];
  
  if (inputFile && require('fs').existsSync(inputFile)) {
    const content = readFileSync(inputFile, 'utf-8');
    urls = content.trim().split('\n').filter(Boolean);
  } else {
    // Read from stdin
    const stdin = await new Promise(resolve => {
      let data = '';
      process.stdin.on('data', chunk => data += chunk);
      process.stdin.on('end', () => resolve(data));
    });
    urls = stdin.trim().split('\n').filter(Boolean);
  }

  if (urls.length === 0) {
    console.log('No URLs to submit');
    return;
  }

  // Authenticate
  const auth = new google.auth.GoogleAuth({
    keyFile: credsPath,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });

  const indexing = google.indexing({ version: 'v3', auth });

  console.log(`📡 Submitting ${urls.length} URLs to GSC Indexing API...`);

  let success = 0;
  let failed = 0;

  for (const url of urls) {
    try {
      const response = await indexing.urlNotifications.publish({
        requestBody: {
          url: url.trim(),
          type: 'URL_UPDATED',
        },
      });
      console.log(`✅ ${url} → ${response.data.urlNotificationMetadata?.latestUpdate?.type || 'submitted'}`);
      success++;
    } catch (error) {
      console.error(`❌ ${url} → ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Summary: ${success} submitted, ${failed} failed`);
  
  if (failed > 0) process.exit(1);
}

main().catch(console.error);