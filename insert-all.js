const fs = require('fs');
const https = require('https');

const data = JSON.parse(fs.readFileSync('./data/enem-2024.json', 'utf8'));
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA1MDA1NCwiZXhwIjoyMDk0NjI2MDU0fQ.0Qwr1eNEq9dvnPrLLmsSBXNzsKcGtFFWFh3bpH1BuN0';

let saved = 0;

async function saveBatch(items) {
  const payload = JSON.stringify(items);

  return new Promise((resolve) => {
    const options = {
      hostname: 'lxlwajmzwvqwimuvvsrb.supabase.co',
      port: 443,
      path: '/rest/v1/question_explanations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'apikey': key,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Prefer': 'resolution=merge-duplicates'  // Ignora duplicatas
      }
    };

    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          saved += items.length;
          console.log(`✅ ${saved} salvas (último lote: ${items.length})`);
        } else {
          console.log(`⚠️ Lote retornou ${res.statusCode}`);
        }
        resolve();
      });
    });

    req.on('error', () => {
      console.log(`❌ Erro na requisição`);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

// Processar em lotes de 30
(async () => {
  console.log(`🚀 Inserindo ${data.length} explicações em lotes...\n`);

  let batch = [];
  for (let i = 0; i < data.length; i++) {
    const q = data[i];
    const exp = {
      question_id: q.id,
      explanation: `Resposta correta: ${q.correctAlternative} - ${q.alternatives.find(a => a.letter === q.correctAlternative)?.text || 'Ver alternativa'}`
    };

    batch.push(exp);

    if (batch.length >= 30 || i === data.length - 1) {
      await saveBatch(batch);
      batch = [];
      await new Promise(r => setTimeout(r, 200)); // Rate limit
    }
  }

  console.log(`\n✅ Conclusão: ${saved} explicações salvas!`);
})();
