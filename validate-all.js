const https = require('https');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./data/enem-2024.json', 'utf8'));
const projectIds = new Set(data.map(q => q.id));

console.log(`\n🔍 Validando cobertura completa...\n`);

// Buscar TUDO em batches
async function buscarTodas() {
  const savedIds = new Set();
  let offset = 0;

  while (true) {
    const url = `https://lxlwajmzwvqwimuvvsrb.supabase.co/rest/v1/question_explanations?limit=1000&offset=${offset}`;
    const headers = {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA1MDA1NCwiZXhwIjoyMDk0NjI2MDU0fQ.0Qwr1eNEq9dvnPrLLmsSBXNzsKcGtFFWFh3bpH1BuN0',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTAwNTQsImV4cCI6MjA5NDYyNjA1NH0.FZj-G3Bg9Z5TfqsYnS6zm8KuwoW-As64m0kzk_ycfzA'
    };

    const rows = await new Promise((resolve) => {
      https.get(url, { headers }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve([]);
          }
        });
      }).on('error', () => resolve([]));
    });

    if (rows.length === 0) break;

    rows.forEach(r => savedIds.add(r.question_id));
    offset += 1000;
    console.log(`  Lido: ${offset} registros...`);
  }

  return savedIds;
}

buscarTodas().then(savedIds => {
  const covered = [...projectIds].filter(id => savedIds.has(id));
  const missing = [...projectIds].filter(id => !savedIds.has(id));

  console.log(`\n📊 RESULTADO FINAL:\n`);
  console.log(`Total no projeto: ${projectIds.size}`);
  console.log(`✅ Com explicação: ${covered.length}`);
  console.log(`❌ Faltando: ${missing.length}`);
  console.log(`📈 Cobertura: ${(covered.length/projectIds.size*100).toFixed(1)}%\n`);

  if (missing.length === 0) {
    console.log(`🎉 PERFEITO! Todas as 180 questões têm explicação!\n`);
  } else {
    console.log(`Faltando: ${missing.join(', ')}\n`);
  }
});
