const https = require('https');

const SUPABASE_URL = 'lxlwajmzwvqwimuvvsrb.supabase.co';
const AUTH_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA1MDA1NCwiZXhwIjoyMDk0NjI2MDU0fQ.0Qwr1eNEq9dvnPrLLmsSBXNzsKcGtFFWFh3bpH1BuN0';

function fetchPage(offset, limit) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: `/rest/v1/question_explanations?select=question_id&order=question_id.asc&offset=${offset}&limit=${limit}`,
      headers: {
        'Authorization': `Bearer ${AUTH_KEY}`,
        'apikey': AUTH_KEY,
      },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Get exact count via Content-Range header
function fetchCount() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: `/rest/v1/question_explanations?select=question_id`,
      headers: {
        'Authorization': `Bearer ${AUTH_KEY}`,
        'apikey': AUTH_KEY,
        'Prefer': 'count=exact',
        'Range': '0-0',
      },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const range = res.headers['content-range'];
        resolve(range);
      });
    }).on('error', reject);
  });
}

async function main() {
  const range = await fetchCount();
  console.log(`📊 Content-Range: ${range}`);
  const total = range ? parseInt(range.split('/')[1]) : 0;
  console.log(`\n✅ Total de explicações no banco: ${total}\n`);

  // Paginate to get all IDs and break down by year
  let allIds = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const page = await fetchPage(offset, pageSize);
    if (!page || page.length === 0) break;
    allIds = allIds.concat(page.map(r => r.question_id));
    offset += pageSize;
    if (page.length < pageSize) break;
  }

  console.log(`📋 IDs coletados: ${allIds.length}\n`);

  const byYear = {};
  allIds.forEach(id => {
    const year = id.split('-')[0];
    byYear[year] = (byYear[year] || 0) + 1;
  });

  console.log('📅 Distribuição por ano:');
  Object.keys(byYear).sort().forEach(year => {
    console.log(`   ${year}: ${byYear[year]} explicações`);
  });

  console.log(`\n🎯 Total geral: ${allIds.length} explicações no banco`);
  console.log(`📈 Se o total esperado é 3600: ${((allIds.length / 3600) * 100).toFixed(1)}% de cobertura`);
  console.log(`❌ Faltariam: ${Math.max(0, 3600 - allIds.length)} questões`);
}

main().catch(console.error);
