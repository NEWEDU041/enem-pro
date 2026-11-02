const http = require('http');
const port = process.env.PORT || 3101;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/api/health' || req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ 
      status: 'ok',
      service: 'enem-pro-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
  } else if (req.url === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'ENEM Pro API' }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(port, () => console.log(`ENEM-Pro API running on port ${port}`));
process.on('SIGTERM', () => { console.log('Shutting down'); server.close(); });
