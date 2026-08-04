const https = require('https');

const url = 'https://lxlwajmzwvqwimuvvsrb.supabase.co/rest/v1/question_explanations?select=question_id&order=question_id.asc&limit=1000';
const headers = {
  'Authorization': 'Bearer SUPABASE_SERVICE_ROLE_KEY_REMOVED',
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTAwNTQsImV4cCI6MjA5NDYyNjA1NH0.FZj-G3Bg9Z5TfqsYnS6zm8KuwoW-As64m0kzk_ycfzA'
};

https.get(url, { headers }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const rows = JSON.parse(data);
    const ids2024 = rows.filter(r => r.question_id.startsWith('2024-'));

    console.log(`\nTotal com "2024": ${ids2024.length}\n`);
    ids2024.forEach((r, i) => {
      console.log(`${i+1}. ${r.question_id}`);
    });
  });
});
