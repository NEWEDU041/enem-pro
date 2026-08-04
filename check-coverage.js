const https = require('https');
const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('./data/enem-2024.json', 'utf8'));
const projectIds = new Set(questions.map(q => q.id));

console.log(`\n🔍 Verificando coverage do projeto:\n`);
console.log(`Questões no arquivo: ${questions.length}`);

const url = 'https://lxlwajmzwvqwimuvvsrb.supabase.co/rest/v1/question_explanations?limit=10000';
const headers = {
  'Authorization': 'Bearer SUPABASE_SERVICE_ROLE_KEY_REMOVED',
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTAwNTQsImV4cCI6MjA5NDYyNjA1NH0.FZj-G3Bg9Z5TfqsYnS6zm8KuwoW-As64m0kzk_ycfzA'
};

https.get(url, { headers }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const rows = JSON.parse(data);
      const savedIds = new Set(rows.map(r => r.question_id));

      const covered = [...projectIds].filter(id => savedIds.has(id));
      const missing = [...projectIds].filter(id => !savedIds.has(id));

      console.log(`\n✅ Questões com explicação: ${covered.length}`);
      console.log(`❌ Faltando: ${missing.length}`);
      console.log(`📊 Cobertura: ${(covered.length/projectIds.size*100).toFixed(1)}%\n`);

      if (missing.length > 0) {
        console.log(`Questões faltando:`);
        missing.forEach((id, i) => {
          if (i < 180) console.log(`  ${i+1}. ${id}`);
        });
      } else {
        console.log(`✅ Todas as 180 questões têm explicação!`);
      }
    } catch (e) {
      console.error('Erro:', e.message);
    }
  });
}).on('error', err => {
  console.error('Erro conexão:', err.message);
});
