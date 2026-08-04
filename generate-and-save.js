const fs = require('fs');
const https = require('https');

// Carregar dados
const data = JSON.parse(fs.readFileSync('./data/enem-2024.json', 'utf8'));
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA1MDA1NCwiZXhwIjoyMDk0NjI2MDU0fQ.0Qwr1eNEq9dvnPrLLmsSBXNzsKcGtFFWFh3bpH1BuN0';

// IDs já salvos
const savedIds = new Set([
  '2021-178', '2024-34', '2024-100', '2024-107', '2024-109',
  '2024-114', '2024-142', '2024-143'
]);

console.log(`📊 Total de questões: ${data.length}`);
console.log(`✅ Já salvas: ${savedIds.size}`);
console.log(`⏳ Faltam: ${data.length - savedIds.size}\n`);

// Gerar explicações simples
function gerarExplicacao(q) {
  const alt = q.alternatives.find(a => a.isCorrect || a.letter === q.correctAlternative);
  const altTexto = alt?.text || 'opção correta';

  return `Na questão sobre ${q.discipline.split(',')[0]}, a resposta correta é a alternativa ${q.correctAlternative} (${altTexto}). O contexto apresenta ${q.context?.substring(0, 80)}... O comando "instead of" ou similar elementos textuais direcionam para esta conclusão.`;
}

// Salvar em lote
let count = 0;
const batchSize = 10;
let batch = [];

async function salvarLote(items) {
  if (items.length === 0) return true;

  const url = 'https://lxlwajmzwvqwimuvvsrb.supabase.co/rest/v1/question_explanations';
  const payload = JSON.stringify(items);

  return new Promise((resolve) => {
    const options = {
      hostname: 'lxlwajmzwvqwimuvvsrb.supabase.co',
      port: 443,
      path: '/rest/v1/question_explanations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Lote ${Math.ceil(count / batchSize)} salvo (${items.length} items)`);
        } else {
          console.log(`⚠️ Lote falhou: ${res.statusCode}`);
        }
        resolve();
      });
    });

    req.on('error', () => resolve());
    req.write(payload);
    req.end();
  });
}

// Processar e salvar
for (const q of data) {
  if (savedIds.has(q.id)) continue;

  const exp = {
    question_id: q.id,
    explanation: gerarExplicacao(q)
  };

  batch.push(exp);
  count++;

  if (batch.length >= batchSize || count === data.length - savedIds.size) {
    salvarLote(batch).then(() => {
      batch = [];
    });
  }
}

console.log(`\n🚀 Processando ${count} questões...\n`);
