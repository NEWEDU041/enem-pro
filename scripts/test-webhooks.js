#!/usr/bin/env node

/**
 * Webhook Signature Testing Script
 * 
 * This script generates valid Stripe and Anthropic webhook signatures
 * and tests them against the webhook endpoints.
 * 
 * Usage:
 *   node scripts/test-webhooks.js
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');

const LOCALHOST_PORT = process.env.PORT || 3000;
const USE_HTTPS = process.env.HTTPS === 'true';
const BASE_URL = `http${USE_HTTPS ? 's' : ''}://localhost:${LOCALHOST_PORT}`;

// Colors for CLI output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, prefix, message) {
  console.log(`${color}${prefix}${colors.reset} ${message}`);
}

function success(msg) {
  log(colors.green, '✓', msg);
}

function error(msg) {
  log(colors.red, '✗', msg);
}

function info(msg) {
  log(colors.blue, 'ℹ', msg);
}

function warn(msg) {
  log(colors.yellow, '⚠', msg);
}

function test(msg) {
  log(colors.cyan, '→', msg);
}

/**
 * Generate valid Stripe signature
 */
function generateStripeSignature(body, secret) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedContent = `${timestamp}.${body}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('hex');

  return {
    timestamp,
    signature,
    header: `t=${timestamp},v1=${signature}`,
  };
}

/**
 * Send HTTP request and return response
 */
function sendRequest(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const protocol = USE_HTTPS ? https : http;
    const url = new URL(`${BASE_URL}${path}`);

    const options = {
      hostname: url.hostname,
      port: url.port || (USE_HTTPS ? 443 : 80),
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
      },
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Test Stripe webhook with valid signature
 */
async function testStripeValid() {
  test('Testing Stripe webhook with VALID signature');

  const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecret) {
    warn('STRIPE_WEBHOOK_SECRET not set in environment');
    info('Set it with: export STRIPE_WEBHOOK_SECRET="whsec_test_..."');
    return;
  }

  const body = JSON.stringify({
    id: 'evt_test_valid_' + Date.now(),
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        customer: 'cus_test_456',
        subscription: 'sub_test_789',
      },
    },
  });

  const sig = generateStripeSignature(body, stripeSecret);

  try {
    const response = await sendRequest('POST', '/api/webhook', body, {
      'stripe-signature': sig.header,
    });

    if (response.status === 200) {
      success(`Stripe valid signature accepted (HTTP ${response.status})`);
      info(`Body: ${body.substring(0, 60)}...`);
      info(`Signature: t=${sig.timestamp},v1=${sig.signature.substring(0, 16)}...`);
    } else {
      error(`Stripe valid signature rejected (HTTP ${response.status})`);
      info(`Response: ${response.body}`);
    }
  } catch (err) {
    error(`Request failed: ${err.message}`);
    info(`Is the server running on ${BASE_URL}?`);
  }
}

/**
 * Test Stripe webhook with invalid signature
 */
async function testStripeInvalid() {
  test('Testing Stripe webhook with INVALID signature (should reject)');

  const body = JSON.stringify({
    id: 'evt_test_invalid_' + Date.now(),
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_fake_999' } },
  });

  const badSignature = 't=1234567890,v1=0000000000000000000000000000000000000000000000000000000000000000';

  try {
    const response = await sendRequest('POST', '/api/webhook', body, {
      'stripe-signature': badSignature,
    });

    if (response.status === 401) {
      success(`Stripe invalid signature correctly rejected (HTTP ${response.status})`);
      info(`Response: ${response.body.substring(0, 80)}...`);
    } else {
      error(`Stripe invalid signature was NOT rejected (HTTP ${response.status})`);
      warn('This is a SECURITY ISSUE!');
      info(`Response: ${response.body}`);
    }
  } catch (err) {
    error(`Request failed: ${err.message}`);
  }
}

/**
 * Test Stripe webhook with no signature
 */
async function testStripeMissing() {
  test('Testing Stripe webhook with MISSING signature (should reject)');

  const body = JSON.stringify({
    id: 'evt_test_nosig_' + Date.now(),
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_nosig_999' } },
  });

  try {
    const response = await sendRequest('POST', '/api/webhook', body);

    if (response.status === 401) {
      success(`Stripe missing signature correctly rejected (HTTP ${response.status})`);
    } else {
      error(`Stripe missing signature was NOT rejected (HTTP ${response.status})`);
      warn('This is a SECURITY ISSUE!');
    }
  } catch (err) {
    error(`Request failed: ${err.message}`);
  }
}

/**
 * Test Anthropic webhook with valid token
 */
async function testAnthropicValid() {
  test('Testing Anthropic webhook with VALID token');

  const token = process.env.ANTHROPIC_WEBHOOK_TOKEN;
  if (!token) {
    warn('ANTHROPIC_WEBHOOK_TOKEN not set in environment');
    info('Set it with: export ANTHROPIC_WEBHOOK_TOKEN="webhook_token_..."');
    return;
  }

  const body = JSON.stringify({
    type: 'message.completed',
    created_at: new Date().toISOString(),
    data: {
      id: 'msg_test_valid_' + Date.now(),
      role: 'assistant',
      content: 'Test message content',
    },
  });

  try {
    const response = await sendRequest('POST', '/api/webhooks/anthropic', body, {
      'Authorization': `Bearer ${token}`,
    });

    if (response.status === 200) {
      success(`Anthropic valid token accepted (HTTP ${response.status})`);
      info(`Body: ${body.substring(0, 60)}...`);
      info(`Token: ${token.substring(0, 16)}...`);
    } else {
      error(`Anthropic valid token rejected (HTTP ${response.status})`);
      info(`Response: ${response.body}`);
    }
  } catch (err) {
    error(`Request failed: ${err.message}`);
    info(`Is the server running on ${BASE_URL}?`);
  }
}

/**
 * Test Anthropic webhook with invalid token
 */
async function testAnthropicInvalid() {
  test('Testing Anthropic webhook with INVALID token (should reject)');

  const body = JSON.stringify({
    type: 'message.completed',
    created_at: new Date().toISOString(),
    data: { id: 'msg_test_invalid_' + Date.now() },
  });

  try {
    const response = await sendRequest('POST', '/api/webhooks/anthropic', body, {
      'Authorization': 'Bearer wrong_token_xyz',
    });

    if (response.status === 401) {
      success(`Anthropic invalid token correctly rejected (HTTP ${response.status})`);
      info(`Response: ${response.body.substring(0, 80)}...`);
    } else {
      error(`Anthropic invalid token was NOT rejected (HTTP ${response.status})`);
      warn('This is a SECURITY ISSUE!');
      info(`Response: ${response.body}`);
    }
  } catch (err) {
    error(`Request failed: ${err.message}`);
  }
}

/**
 * Test Anthropic webhook with no token
 */
async function testAnthropicMissing() {
  test('Testing Anthropic webhook with MISSING token (should reject)');

  const body = JSON.stringify({
    type: 'message.completed',
    created_at: new Date().toISOString(),
    data: { id: 'msg_test_nosig_' + Date.now() },
  });

  try {
    const response = await sendRequest('POST', '/api/webhooks/anthropic', body);

    if (response.status === 401) {
      success(`Anthropic missing token correctly rejected (HTTP ${response.status})`);
    } else {
      error(`Anthropic missing token was NOT rejected (HTTP ${response.status})`);
      warn('This is a SECURITY ISSUE!');
    }
  } catch (err) {
    error(`Request failed: ${err.message}`);
  }
}

/**
 * Main test suite
 */
async function runTests() {
  console.log('\n' + colors.cyan + '═══════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.cyan + '     WEBHOOK SIGNATURE VERIFICATION TEST SUITE' + colors.reset);
  console.log(colors.cyan + '═══════════════════════════════════════════════════════\n' + colors.reset);

  info(`Server: ${BASE_URL}`);
  console.log();

  // Stripe Tests
  console.log(colors.blue + '📦 STRIPE WEBHOOK TESTS' + colors.reset);
  console.log(colors.blue + '────────────────────────' + colors.reset);
  await testStripeValid();
  await testStripeInvalid();
  await testStripeMissing();
  console.log();

  // Anthropic Tests
  console.log(colors.blue + '🤖 ANTHROPIC WEBHOOK TESTS' + colors.reset);
  console.log(colors.blue + '────────────────────────────' + colors.reset);
  await testAnthropicValid();
  await testAnthropicInvalid();
  await testAnthropicMissing();
  console.log();

  console.log(colors.cyan + '═══════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.cyan + '     TEST SUITE COMPLETE' + colors.reset);
  console.log(colors.cyan + '═══════════════════════════════════════════════════════\n' + colors.reset);
}

// Run tests
runTests().catch((err) => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
