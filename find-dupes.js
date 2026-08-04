const https = require('https');
const fs = require('fs');

const url = 'https://lxlwajmzwvqwimuvvsrb.supabase.co/rest/v1/question_explanations?limit=10000&offset=0';
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

      const countMap = {};
      const dupes = [];

      rows.forEach(row => {
        countMap[row.question_id] = (countMap[row.question_id] || 0) + 1;
      });

      Object.entries(countMap).forEach(([id, count]) => {
        if (count > 1) dupes.push({ id, count });
      });

      console.log(`\n📊 Análise de Duplicatas:\n`);
      console.log(`Total de registros: ${rows.length}`);
      console.log(`IDs únicas: ${Object.keys(countMap).length}`);
      console.log(`Duplicatas encontradas: ${dupes.length}\n`);

      if (dupes.length > 0) {
        console.log(`Primeiras duplicatas:`);
        dupes.slice(0, 10).forEach(d => {
          console.log(`  - ${d.id}: ${d.count}x`);
        });
        if (dupes.length > 10) console.log(`  ... e ${dupes.length - 10} mais\n`);
      }

      // Limpeza sugerida
      if (dupes.length > 0) {
        console.log(`⚠️ Recomendação: Limpar duplicatas`);
        console.log(`Isso pode ser feito deletando e regenerando as explicações.\n`);
      }
    } catch (e) {
      console.error('Erro:', e.message);
    }
  });
}).on('error', err => {
  console.error('Erro conexão:', err.message);
});
