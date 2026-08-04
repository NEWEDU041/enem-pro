const https = require('https');
const fs = require('fs');

// Dados já salvos no Supabase
const savedIds = new Set([
  '2021-178', '2024-34', '2024-100', '2024-100', '2024-100',
  '2024-100', '2024-100', '2024-100', '2024-100', '2024-107',
  '2024-109', '2024-114', '2024-142', '2024-143'
]);

// Exemplos de explicações para gerar em lote
const explanations = [
  {
    "question_id": "2024-1",
    "explanation": "A questão aborda a letra de Alicia Keys 'Holy War' que critica ódio e intolerância. O marcador 'instead of' (em vez de) introduz uma mudança de comportamento proposta pela autora. Ella sugere que em vez de polir 'bombas de guerra santa' (conflitos), deveríamos 'amar alguém' e 'se importar um pouco mais'. Isso demonstra uma transição de um cenário de conflito para uma perspectiva que valoriza a mudança de comportamento em direção ao amor e solidariedade. Portanto, a resposta correta é A) mudança de comportamento."
  },
  {
    "question_id": "2024-2",
    "explanation": "Este texto estabelece uma analogia entre elementos da natureza (como árvores, chuva) e comandos de programação (como 'delete', 'execute') para alertar sobre a rápida destruição da natureza. A relação proposta utiliza linguagem técnica familiar aos leitores para reforçar a urgência da crise ambiental. A intenção é conscientizar sobre os perigos, não informar sobre tecnologias sustentáveis ou crescimento de árvores. Resposta: A) alertar as pessoas sobre a rápida destruição da natureza."
  },
  {
    "question_id": "2024-3",
    "explanation": "As citações de Einstein e Bob Marley compartilham uma crença comum: a necessidade de visualizar as coisas como gostaria que fossem para transformar a realidade. Einstein acredita na imaginação como mais importante que conhecimento; Marley fala sobre 'ver o bem nas coisas'. Ambos apontam para a importância da visão de mundo positiva como ferramenta de transformação. Resposta: aquela que menciona visualizar/ver coisas como gostaria que fossem."
  }
];

// Função para salvar em lote
async function saveExplanations() {
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA1MDA1NCwiZXhwIjoyMDk0NjI2MDU0fQ.0Qwr1eNEq9dvnPrLLmsSBXNzsKcGtFFWFh3bpH1BuN0';

  for (let i = 0; i < explanations.length; i++) {
    const exp = explanations[i];

    // Skip se já existe
    if (savedIds.has(exp.question_id)) {
      console.log(`⏭️  ${exp.question_id} - já existe`);
      continue;
    }

    const data = JSON.stringify([exp]);

    const options = {
      hostname: 'lxlwajmzwvqwimuvvsrb.supabase.co',
      port: 443,
      path: '/rest/v1/question_explanations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Prefer': 'return=minimal'
      }
    };

    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ ${exp.question_id} - Salva`);
          } else {
            console.log(`❌ ${exp.question_id} - Status ${res.statusCode}`);
          }
          resolve();
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });

    // Rate limit
    await new Promise(r => setTimeout(r, 200));
  }
}

saveExplanations().catch(console.error);
