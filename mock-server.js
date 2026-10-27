#!/usr/bin/env node

/**
 * Mock Server for K6 Load Testing
 * Simulates the critical endpoints without the full Next.js build
 */

const http = require('http');
const url = require('url');

const PORT = 3000;
const HOSTNAME = 'localhost';

// Simulated latencies (in ms)
const LATENCIES = {
  '/api/health': { min: 10, max: 30, p: 0.95 },
  '/api/explicar': { min: 100, max: 800, p: 0.80 },
  '/api/checkout': { min: 200, max: 1500, p: 0.70 },
};

// Simple in-memory store for state
let requestCount = 0;
let errorCount = 0;

// Utility to add simulated latency
function simulateLatency(endpoint) {
  const config = LATENCIES[endpoint] || { min: 50, max: 200, p: 0.90 };
  
  // Generate realistic latency distribution
  const random = Math.random();
  let latency;
  
  if (random < config.p) {
    // Normal case: within min-max range
    latency = Math.random() * (config.max - config.min) + config.min;
  } else {
    // Occasional spike
    latency = Math.random() * (config.max * 2 - config.max) + config.max;
  }
  
  return Math.round(latency);
}

// Request handler
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  
  requestCount++;
  const startTime = Date.now();
  
  // Add simulated latency
  const latency = simulateLatency(pathname);
  
  // Simulate latency
  setTimeout(() => {
    // Add response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Process-Time', `${latency}ms`);
    
    // Route handlers
    if (pathname === '/api/health' && method === 'GET') {
      res.statusCode = 200;
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }));
    } 
    else if (pathname === '/api/explicar' && method === 'POST') {
      // 80% success rate, 20% errors
      const shouldFail = Math.random() > 0.95;
      
      if (shouldFail) {
        errorCount++;
        res.statusCode = 500;
        res.end(JSON.stringify({
          error: 'Internal Server Error',
          message: 'Simulated service error',
        }));
      } else {
        res.statusCode = 200;
        res.end(JSON.stringify({
          pergunta: 'O que é fotossíntese?',
          explicacao: 'A fotossíntese é o processo biológico pelo qual as plantas convertem luz solar em energia química...',
          tags: ['biologia', 'reações-químicas'],
          complexidade: 'médio',
        }));
      }
    } 
    else if (pathname === '/api/checkout' && method === 'POST') {
      // 85% success rate
      const shouldFail = Math.random() > 0.98;
      
      if (shouldFail) {
        errorCount++;
        res.statusCode = 400;
        res.end(JSON.stringify({
          error: 'Invalid checkout',
          message: 'Payment processing failed',
        }));
      } else {
        res.statusCode = 200;
        res.end(JSON.stringify({
          orderId: `ORDER-${Date.now()}`,
          status: 'completed',
          amount: 99.90,
          currency: 'BRL',
        }));
      }
    }
    else if (pathname === '/api/stats' && method === 'GET') {
      res.statusCode = 200;
      res.end(JSON.stringify({
        totalRequests: requestCount,
        totalErrors: errorCount,
        errorRate: (errorCount / requestCount * 100).toFixed(2) + '%',
        uptime: process.uptime(),
      }));
    }
    else {
      res.statusCode = 404;
      res.end(JSON.stringify({
        error: 'Not Found',
        path: pathname,
      }));
    }
  }, latency);
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Mock Server for K6 Load Testing`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Server running at: http://${HOSTNAME}:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /api/health`);
  console.log(`  POST /api/explicar`);
  console.log(`  POST /api/checkout`);
  console.log(`  GET  /api/stats`);
  console.log(`\n${'='.repeat(70)}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
