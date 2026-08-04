const https = require('https');
const fs = require('fs');

const url = 'https://lxlwajmzwvqwimuvvsrb.supabase.co/rest/v1/question_explanations?limit=10000&offset=0';
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
      const count = Array.isArray(rows) ? rows.length : 0;

      const questions = JSON.parse(fs.readFileSync('./data/enem-2024.json', 'utf8'));
      const questionIds = new Set(questions.map(q => q.id));

      const savedIds = new Set(rows.map(r => r.question_id));
      const missing = [...questionIds].filter(id => !savedIds.has(id));

      console.log(`\n📊 Status de Explicações:\n`);
      console.log(`Total de questões: ${questionIds.size}`);
      console.log(`Com explicação: ${savedIds.size}`);
      console.log(`Faltam: ${missing.length}`);
      console.log(`Progresso: ${(savedIds.size/questionIds.size*100).toFixed(1)}%\n`);

      if (missing.length > 0 && missing.length <= 20) {
        console.log(`⏳ Questões faltando:`);
        missing.slice(0, 10).forEach(id => console.log(`  - ${id}`));
        if (missing.length > 10) console.log(`  ... e ${missing.length - 10} mais`);
      }
    } catch (e) {
      console.error('Erro:', e.message);
    }
  });
}).on('error', err => {
  console.error('Erro conexão:', err.message);
});
