const fs = require('fs');
const https = require('https');

const data = JSON.parse(fs.readFileSync('./data/enem-2024.json', 'utf8'));
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA1MDA1NCwiZXhwIjoyMDk0NjI2MDU0fQ.0Qwr1eNEq9dvnPrLLmsSBXNzsKcGtFFWFh3bpH1BuN0';

let saved = 0;
let skipped = 0;

async function saveOne(q) {
  const exp = `Para a questão "${q.title.substring(0, 40)}...", a resposta correta é ${q.correctAlternative}. ${q.alternatives.find(a => a.letter === q.correctAlternative)?.text || 'Ver alternativa'}.`;

  const payload = JSON.stringify({
    question_id: q.id,
    explanation: exp
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'lxlwajmzwvqwimuvvsrb.supabase.co',
      port: 443,
      path: `/rest/v1/question_explanations?question_id=eq.${q.id}`,
      method: 'PATCH',  // Use PATCH para update
      headers: {
        'Authorization': `Bearer ${key}`,
        'apikey': key,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          saved++;
          if (saved % 10 === 0) console.log(`✅ ${saved} salvas`);
        }
        resolve();
      });
    });

    req.on('error', resolve);
    req.write(payload);
    req.end();
  });
}

// Salvar todas
(async () => {
  console.log(`🚀 Salvando ${data.length} explicações...\n`);

  for (const q of data) {
    await saveOne(q);
    await new Promise(r => setTimeout(r, 50)); // Rate limit
  }

  console.log(`\n✅ Total salvo: ${saved}`);
})();
