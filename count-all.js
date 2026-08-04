const https = require('https');

const url = 'https://lxlwajmzwvqwimuvvsrb.supabase.co/rest/v1/question_explanations?limit=500';
const headers = {
  'Authorization': 'Bearer SUPABASE_SERVICE_ROLE_KEY_REMOVED',
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTAwNTQsImV4cCI6MjA5NDYyNjA1NH0.FZj-G3Bg9Z5TfqsYnS6zm8KuwoW-As64m0kzk_ycfzA'
};

https.get(url, { headers }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const rows = JSON.parse(data);
    const ids = rows.map(r => r.question_id);

    console.log(`\n✅ Total salvo: ${rows.length}`);
    console.log(`🎯 IDs do projeto encontradas:`);

    // Count which ones from the project exist
    const projectIds = new Set();
    for (let i = 1; i <= 180; i++) {
      projectIds.add(`2024-${i}`);
    }

    const found = ids.filter(id => projectIds.has(id));
    console.log(`✅ Do projeto: ${found.length}/180 (${(found.length/180*100).toFixed(1)}%)`);
    console.log(`\nPrimeiras 20: ${found.slice(0, 20).join(', ')}`);
    console.log(`Últimas 5: ${found.slice(-5).join(', ')}\n`);
  });
}).on('error', err => console.error('Erro:', err.message));
