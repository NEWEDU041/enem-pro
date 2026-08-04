const https = require('https');
const fs = require('fs');

// Todas as IDs que DEVERIAM estar lá
const data = JSON.parse(fs.readFileSync('./data/enem-2024.json', 'utf8'));
const targetIds = data.map(q => q.id);

// Buscar TUDO do banco (sem filter de range)
const url = 'https://lxlwajmzwvqwimuvvsrb.supabase.co/rest/v1/question_explanations?limit=1000';
const headers = {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA1MDA1NCwiZXhwIjoyMDk0NjI2MDU0fQ.0Qwr1eNEq9dvnPrLLmsSBXNzsKcGtFFWFh3bpH1BuN0',
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTAwNTQsImV4cCI6MjA5NDYyNjA1NH0.FZj-G3Bg9Z5TfqsYnS6zm8KuwoW-As64m0kzk_ycfzA'
};

https.get(url, { headers }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const rows = JSON.parse(data);
    const targetSet = new Set(targetIds);
    const found = rows.filter(r => targetSet.has(r.question_id));

    console.log(`\n📊 RESULTADO FINAL:\n`);
    console.log(`Total no banco: ${rows.length}`);
    console.log(`Total no projeto: ${targetIds.length}`);
    console.log(`✅ Cobertura ENEM 2024: ${found.length}/${targetIds.length} (${(found.length/targetIds.length*100).toFixed(1)}%)\n`);

    if (found.length === targetIds.length) {
      console.log(`🎉 PERFEITO! Todas as 180 questões têm explicação!`);
    } else {
      const missing = targetIds.filter(id => !found.find(r => r.question_id === id));
      console.log(`⏳ Faltando: ${missing.length}`);
      console.log(`Primeiras 5: ${missing.slice(0, 5).join(', ')}`);
    }
  });
});
