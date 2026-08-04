const https = require('https');

const url = 'https://lxlwajmzwvqwimuvvsrb.supabase.co/rest/v1/question_explanations?select=question_id&Prefer=count%3Donly';
const headers = {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA1MDA1NCwiZXhwIjoyMDk0NjI2MDU0fQ.0Qwr1eNEq9dvnPrLLmsSBXNzsKcGtFFWFh3bpH1BuN0',
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTAwNTQsImV4cCI6MjA5NDYyNjA1NH0.FZj-G3Bg9Z5TfqsYnS6zm8KuwoW-As64m0kzk_ycfzA'
};

const req = https.request(url, { headers, method: 'HEAD' }, (res) => {
  const count = res.headers['content-range'];
  console.log(`\n📊 Content-Range: ${count}`);

  // Try GET instead
  https.get(url, { headers }, (res) => {
    console.log(`\nStatus: ${res.statusCode}`);
    console.log(`Headers:`, Object.keys(res.headers));

    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`\nBody: ${data.substring(0, 100)}`);
    });
  });
});

req.end();
