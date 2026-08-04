const https = require('https');
const fs = require('fs');

// Carregar questões do arquivo
const data = JSON.parse(fs.readFileSync('./data/enem-2024.json', 'utf8'));
const allIds = new Set(data.map(q => q.id));

// Buscar do banco
const url = 'https://lxlwajmzwvqwimuvvsrb.supabase.co/rest/v1/question_explanations?question_id=gte.2024-1&question_id=lte.2024-180&limit=500';
const headers = {
  'Authorization': 'Bearer SUPABASE_SERVICE_ROLE_KEY_REMOVED',
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTAwNTQsImV4cCI6MjA5NDYyNjA1NH0.FZj-G3Bg9Z5TfqsYnS6zm8KuwoW-As64m0kzk_ycfzA'
};

https.get(url, { headers }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const rows = JSON.parse(data);
    const savedIds = new Set(rows.map(r => r.question_id));

    const missing = [...allIds].filter(id => !savedIds.has(id)).sort();

    console.log(`\n❌ Faltando: ${missing.length}/180\n`);
    console.log(`IDs: ${missing.join(', ')}\n`);
  });
});
