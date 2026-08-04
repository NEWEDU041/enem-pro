const https = require('https');

const url = 'https://lxlwajmzwvqwimuvvsrb.supabase.co/rest/v1/question_explanations?question_id=gte.2024-1&question_id=lte.2024-180&limit=500';
const headers = {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA1MDA1NCwiZXhwIjoyMDk0NjI2MDU0fQ.0Qwr1eNEq9dvnPrLLmsSBXNzsKcGtFFWFh3bpH1BuN0',
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTAwNTQsImV4cCI6MjA5NDYyNjA1NH0.FZj-G3Bg9Z5TfqsYnS6zm8KuwoW-As64m0kzk_ycfzA'
};

https.get(url, { headers }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const rows = JSON.parse(data);
      console.log(`\n✅ Questões 2024 encontradas: ${rows.length}/180`);
      console.log(`📊 Cobertura: ${(rows.length/180*100).toFixed(1)}%\n`);

      if (rows.length > 0) {
        console.log(`Primeiras 10:`);
        rows.slice(0, 10).forEach(r => {
          console.log(`  - ${r.question_id}`);
        });
      }
    } catch (e) {
      console.log('Erro ao parsear:', data.substring(0, 200));
    }
  });
}).on('error', err => console.error('Erro:', err.message));
