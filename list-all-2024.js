const https = require('https');

// Buscar em pastas de 1000
async function buscar(offset) {
  return new Promise((resolve) => {
    const url = `https://lxlwajmzwvqwimuvvsrb.supabase.co/rest/v1/question_explanations?select=question_id&order=question_id.asc&limit=1000&offset=${offset}`;
    const headers = {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA1MDA1NCwiZXhwIjoyMDk0NjI2MDU0fQ.0Qwr1eNEq9dvnPrLLmsSBXNzsKcGtFFWFh3bpH1BuN0',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTAwNTQsImV4cCI6MjA5NDYyNjA1NH0.FZj-G3Bg9Z5TfqsYnS6zm8KuwoW-As64m0kzk_ycfzA'
    };

    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const rows = JSON.parse(data);
        resolve(rows);
      });
    });
  });
}

(async () => {
  console.log('Buscando todas as 2024...\n');

  const batch1 = await buscar(0);
  const batch2 = await buscar(1000);

  const ids2024_1 = batch1.filter(r => r.question_id.startsWith('2024-'));
  const ids2024_2 = batch2.filter(r => r.question_id.startsWith('2024-'));

  const total2024 = [...ids2024_1, ...ids2024_2];

  console.log(`✅ Total encontrado: ${total2024.length}\n`);
  total2024.slice(0, 10).forEach(r => console.log(`  - ${r.question_id}`));

  if (total2024.length === 180) {
    console.log(`\n🎉 SUCESSO! Todas as 180 estão no banco!`);
  }
})();
