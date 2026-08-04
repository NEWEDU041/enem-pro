const https = require('https');

const SUPABASE_URL = 'lxlwajmzwvqwimuvvsrb.supabase.co';
const AUTH_KEY = 'SUPABASE_SERVICE_ROLE_KEY_REMOVED';

function fetchPage(offset, limit) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: `/rest/v1/question_explanations?select=question_id&order=question_id.asc&offset=${offset}&limit=${limit}`,
      headers: { 'Authorization': `Bearer ${AUTH_KEY}`, 'apikey': AUTH_KEY },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

const YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009];

async function main() {
  let allIds = [];
  let offset = 0;
  while (true) {
    const page = await fetchPage(offset, 1000);
    if (!page || page.length === 0) break;
    allIds = allIds.concat(page.map(r => r.question_id));
    offset += 1000;
    if (page.length < 1000) break;
  }

  const idSet = new Set(allIds);
  console.log(`Total no banco: ${allIds.length}\n`);

  // For each year, find the max question number present, then check for any gaps 1..max
  let totalGaps = 0;
  for (const year of YEARS) {
    const nums = allIds
      .filter(id => id.startsWith(`${year}-`))
      .map(id => parseInt(id.split('-')[1]))
      .sort((a, b) => a - b);

    if (nums.length === 0) {
      console.log(`${year}: NENHUMA questão encontrada!`);
      continue;
    }

    const max = nums[nums.length - 1];
    const missing = [];
    for (let i = 1; i <= max; i++) {
      if (!idSet.has(`${year}-${i}`)) missing.push(i);
    }

    totalGaps += missing.length;
    const status = missing.length === 0 ? '✅ completo' : `❌ faltam: ${missing.join(', ')}`;
    console.log(`${year}: ${nums.length} questões (1 a ${max}) — ${status}`);
  }

  console.log(`\n🎯 TOTAL DE BURACOS REAIS: ${totalGaps}`);
}

main().catch(console.error);
