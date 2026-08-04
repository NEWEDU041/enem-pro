const fs = require('fs');
const https = require('https');

const data = JSON.parse(fs.readFileSync('./data/enem-2024.json', 'utf8'));
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA1MDA1NCwiZXhwIjoyMDk0NjI2MDU0fQ.0Qwr1eNEq9dvnPrLLmsSBXNzsKcGtFFWFh3bpH1BuN0';

// IDs que faltam
const missing = ['2024-19', '2024-2', '2024-20', '2024-21', '2024-22', '2024-23', '2024-24', '2024-25', '2024-26', '2024-27', '2024-28', '2024-29', '2024-3', '2024-30', '2024-31', '2024-32', '2024-33', '2024-34', '2024-35', '2024-36', '2024-37', '2024-38', '2024-39', '2024-4', '2024-40', '2024-41', '2024-42', '2024-43', '2024-44', '2024-45', '2024-46', '2024-47', '2024-48', '2024-49', '2024-5', '2024-50', '2024-51', '2024-52', '2024-53', '2024-54', '2024-55', '2024-56', '2024-57', '2024-58', '2024-59', '2024-6', '2024-60', '2024-61', '2024-62', '2024-63', '2024-64', '2024-65', '2024-66', '2024-67', '2024-68', '2024-69', '2024-7', '2024-70', '2024-71', '2024-72', '2024-73', '2024-74', '2024-75', '2024-76', '2024-77', '2024-78', '2024-79', '2024-8', '2024-80', '2024-81', '2024-82', '2024-83', '2024-84', '2024-85', '2024-86', '2024-87', '2024-88', '2024-89', '2024-9', '2024-90', '2024-91', '2024-92', '2024-93', '2024-94', '2024-95', '2024-96', '2024-97', '2024-98', '2024-99'];

// Construir payloads
const items = missing.map(id => {
  const q = data.find(x => x.id === id);
  return {
    question_id: id,
    explanation: q ? `Resposta: ${q.correctAlternative} - ${q.alternatives.find(a => a.letter === q.correctAlternative)?.text}` : 'Sem contexto'
  };
});

// Inserir em 3 lotes
async function insertBatch(batch, num) {
  const payload = JSON.stringify(batch);

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
        'Prefer': 'resolution=merge-duplicates'
      }
    };

    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        console.log(`✅ Lote ${num} pronto (${batch.length} items)`);
        resolve();
      });
    });

    req.on('error', () => {
      console.log(`⚠️ Lote ${num} erro`);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

// Executar
(async () => {
  console.log(`🚀 Inserindo ${missing.length} explicações faltantes...\n`);

  const lote1 = items.slice(0, 30);
  const lote2 = items.slice(30, 60);
  const lote3 = items.slice(60);

  await insertBatch(lote1, 1);
  await new Promise(r => setTimeout(r, 300));
  await insertBatch(lote2, 2);
  await new Promise(r => setTimeout(r, 300));
  await insertBatch(lote3, 3);

  console.log(`\n✅ Conclusão! Aguarde alguns segundos e rode: npm run validate-explanations`);
})();
